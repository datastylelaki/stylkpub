"use client";

import { useState, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Category, Product, ProductVariant, Profile, CartItem } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    ShoppingCart,
    Search,
    LogOut,
    Plus,
    Minus,
    Trash2,
    User as UserIcon,
    Package,
    BarChart3,
    Settings
} from "lucide-react";
import Link from "next/link";
import CheckoutDialog from "./CheckoutDialog";
import { ModeToggle } from "@/components/mode-toggle";

interface POSDashboardProps {
    user: User;
    profile: Profile | null;
    categories: Category[];
    products: (Product & { variants: ProductVariant[] })[];
}

export default function POSDashboard({ user, profile, categories, products }: POSDashboardProps) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const supabase = createClient();

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
            // Show all products, even those with 0 stock
            return matchesSearch && matchesCategory;
        });
    }, [products, search, selectedCategory]);

    // Cart calculations
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.variant.product.base_price * item.quantity, 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    // Add to cart
    function addToCart(variant: ProductVariant, product: Product, quantity: number = 1) {
        setCart((prev) => {
            const existing = prev.find((item) => item.variant.id === variant.id);
            if (existing) {
                if (existing.quantity + quantity > variant.stock) {
                    toast.error("Stok tidak cukup!");
                    return prev;
                }
                return prev.map((item) =>
                    item.variant.id === variant.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            if (quantity > variant.stock) {
                toast.error("Stok tidak cukup!");
                return prev;
            }
            return [...prev, { variant: { ...variant, product }, quantity }];
        });
        toast.success(`${product.name} ditambahkan (${quantity})`);
    }

    // Update quantity
    function updateQuantity(variantId: string, delta: number) {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.variant.id === variantId) {
                        const newQty = item.quantity + delta;
                        if (newQty > item.variant.stock) {
                            toast.error("Stok tidak cukup!");
                            return item;
                        }
                        return { ...item, quantity: newQty };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0);
        });
    }

    // Remove from cart
    function removeFromCart(variantId: string) {
        setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
    }

    // Clear cart
    function clearCart() {
        setCart([]);
    }

    // Logout
    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }

    // Format currency
    function formatRupiah(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl font-bold text-black">S</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">POS STYLK</h1>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {profile?.name || user.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Admin/Settings Button */}
                        {profile?.role === "admin" && (
                            <Link href="/admin/products">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Pengaturan">
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </Link>
                        )}

                        {/* Reports Button */}
                        {profile?.role === "admin" && (
                            <Link href="/reports">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Laporan">
                                    <BarChart3 className="h-5 w-5" />
                                </Button>
                            </Link>
                        )}

                        <ModeToggle />

                        {/* Cart Button */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="relative border-border bg-card">
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartItemCount > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-black">
                                            {cartItemCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md bg-background border-border">
                                <SheetHeader>
                                    <SheetTitle className="text-foreground">Keranjang ({cartItemCount})</SheetTitle>
                                </SheetHeader>
                                <div className="mt-4 flex flex-col h-[calc(100vh-180px)]">
                                    {cart.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                            <div className="text-center">
                                                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>Keranjang kosong</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 overflow-auto space-y-3">
                                                {cart.map((item) => (
                                                    <div key={item.variant.id} className="bg-muted/50 rounded-lg p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-foreground">{item.variant.product.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {item.variant.size} / {item.variant.color}
                                                                </p>
                                                                <p className="text-amber-500 font-semibold mt-1">
                                                                    {formatRupiah(item.variant.product.base_price)}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFromCart(item.variant.id)}
                                                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-border"
                                                                onClick={() => updateQuantity(item.variant.id, -1)}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="w-8 text-center text-foreground">{item.quantity}</span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-border"
                                                                onClick={() => updateQuantity(item.variant.id, 1)}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="ml-auto font-semibold text-foreground">
                                                                {formatRupiah(item.variant.product.base_price * item.quantity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Separator className="my-4 bg-border" />
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-lg font-bold">
                                                    <span className="text-foreground">Total</span>
                                                    <span className="text-amber-500">{formatRupiah(cartTotal)}</span>
                                                </div>
                                                <Button
                                                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                                                    onClick={() => setCheckoutOpen(true)}
                                                >
                                                    Bayar Sekarang
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Logout */}
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className={selectedCategory === null
                            ? "bg-amber-500 text-black hover:bg-amber-600"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                    >
                        Semua
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={selectedCategory === cat.id
                                ? "bg-amber-500 text-black hover:bg-amber-600 whitespace-nowrap"
                                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground whitespace-nowrap"
                            }
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </header>

            {/* Products Grid */}
            <main className="p-4">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada produk ditemukan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={addToCart}
                                formatRupiah={formatRupiah}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Checkout Dialog */}
            <CheckoutDialog
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                cart={cart}
                total={cartTotal}
                profile={profile}
                onSuccess={clearCart}
                formatRupiah={formatRupiah}
            />
        </div>
    );
}

import Image from "next/image";

// ... (other imports remain the same)

// Optimized Product Card Component
function ProductCard({
    product,
    onAddToCart,
    formatRupiah,
}: {
    product: Product & { variants: ProductVariant[] };
    onAddToCart: (variant: ProductVariant, product: Product, quantity: number) => void;
    formatRupiah: (amount: number) => string;
}) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.variants?.find((v) => v.stock > 0) || null
    );
    const [quantity, setQuantity] = useState(1);

    const availableSizes = [...new Set(product.variants?.map((v) => v.size))];
    const availableColors = [...new Set(
        product.variants
            ?.filter((v) => !selectedVariant || v.size === selectedVariant.size)
            .map((v) => v.color)
    )];

    function handleSizeSelect(size: string) {
        const variant = product.variants?.find((v) => v.size === size && v.stock > 0);
        setSelectedVariant(variant || null);
    }

    function handleColorSelect(color: string) {
        const variant = product.variants?.find(
            (v) => v.size === selectedVariant?.size && v.color === color && v.stock > 0
        );
        setSelectedVariant(variant || null);
    }

    return (
        <Card className="bg-card border-border overflow-hidden hover:border-amber-500/50 transition-colors">
            {/* Product Image */}
            <div className="aspect-square bg-muted relative">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-8 h-8" />
                    </div>
                )}
                {selectedVariant && (
                    <Badge className="absolute top-2 right-2 bg-black/80 text-white text-xs z-10">
                        Stok: {selectedVariant.stock}
                    </Badge>
                )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
                <h3 className="font-medium text-foreground text-sm line-clamp-2">{product.name}</h3>
                <p className="text-amber-500 font-bold">{formatRupiah(product.base_price)}</p>

                {/* Size Selector */}
                {availableSizes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {availableSizes.map((size) => {
                            const hasStock = product.variants?.some((v) => v.size === size && v.stock > 0);
                            return (
                                <Button
                                    key={size}
                                    variant="outline"
                                    size="sm"
                                    disabled={!hasStock}
                                    onClick={() => handleSizeSelect(size)}
                                    className={`h-7 px-2 text-xs font-semibold ${selectedVariant?.size === size
                                        ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {size}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Color Selector */}
                {selectedVariant && availableColors.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {availableColors.map((color) => {
                            const variant = product.variants?.find(
                                (v) => v.size === selectedVariant.size && v.color === color
                            );
                            return (
                                <Button
                                    key={color}
                                    variant="outline"
                                    size="sm"
                                    disabled={!variant || variant.stock === 0}
                                    onClick={() => handleColorSelect(color)}
                                    className={`h-7 px-2 text-xs font-semibold ${selectedVariant?.color === color
                                        ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {color}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Quantity Controls */}
                {selectedVariant && selectedVariant.stock > 0 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-border"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-foreground font-semibold">{quantity}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-border"
                            onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                            disabled={quantity >= selectedVariant.stock}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Add to Cart */}
                <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                    size="sm"
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    onClick={() => {
                        if (selectedVariant) {
                            onAddToCart(selectedVariant, product, quantity);
                            setQuantity(1);
                        }
                    }}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Tambah ke Keranjang</span>
                    <span className="sm:hidden">Tambah</span>
                </Button>
            </div>
        </Card>
    );
}
