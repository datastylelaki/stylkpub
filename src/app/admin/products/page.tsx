
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ModeToggle } from "@/components/mode-toggle";

import { ProductSearchInput } from "@/components/admin/ProductSearchInput";

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{
        search?: string;
    }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return <div className="p-8 text-center">Akses Ditolak: Anda bukan Admin.</div>;
    }

    const { search } = await searchParams;
    const searchQuery = search || "";

    // Fetch products with category
    let query = supabase
        .from("products")
        .select("*, category:categories(name), variants:product_variants(stock)")
        .order("created_at", { ascending: false });

    if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
    }

    const { data: products } = await query;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Manajemen Produk</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Tambah, edit, atau hapus produk.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <ProductSearchInput />
                    <div className="flex flex-wrap gap-2">
                        <Link href="/" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" /> POS
                            </Button>
                        </Link>
                        <Link href="/admin/categories" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full">
                                Kategori
                            </Button>
                        </Link>
                        <Link href="/admin/users" className="flex-1 md:flex-none">
                            <Button variant="outline" className="text-purple-500 hover:text-purple-600 w-full">
                                User
                            </Button>
                        </Link>
                        <Link href="/admin/products/import" className="flex-1 md:flex-none">
                            <Button variant="outline" className="text-amber-500 hover:text-amber-600 w-full">
                                Import
                            </Button>
                        </Link>
                        <Link href="/admin/settings" className="flex-1 md:flex-none">
                            <Button variant="outline" className="text-muted-foreground hover:text-foreground w-full">
                                Settings
                            </Button>
                        </Link>
                        <Link href="/admin/products/new" className="w-full md:w-auto">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black w-full font-bold">
                                <Plus className="mr-2 h-4 w-4" /> Produk
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block rounded-md border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground">Nama Produk</TableHead>
                                <TableHead className="text-muted-foreground">Kategori</TableHead>
                                <TableHead className="text-muted-foreground">Harga Dasar</TableHead>
                                <TableHead className="text-muted-foreground">Total Stok</TableHead>
                                <TableHead className="text-right text-muted-foreground">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products?.map((product) => {
                                const totalStock = product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
                                return (
                                    <TableRow key={product.id} className="border-border hover:bg-muted/50">
                                        <TableCell className="font-medium text-amber-500">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-border text-muted-foreground">
                                                {product.category?.name || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>Rp {product.base_price.toLocaleString("id-ID")}</TableCell>
                                        <TableCell>{totalStock}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/products/${product.id}/edit`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100/20 dark:hover:bg-blue-900/20">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteProductButton productId={product.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {(!products || products.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Belum ada produk.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {products?.map((product) => {
                        const totalStock = product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
                        return (
                            <div key={product.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-amber-500">{product.name}</h3>
                                        <Badge variant="outline" className="mt-1 border-border text-muted-foreground">
                                            {product.category?.name || "-"}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-500 border border-border">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <DeleteProductButton productId={product.id} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border">
                                    <div>
                                        <p className="text-muted-foreground">Harga Dasar</p>
                                        <p className="font-medium">Rp {product.base_price.toLocaleString("id-ID")}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Stok</p>
                                        <p className="font-medium">{totalStock}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(!products || products.length === 0) && (
                        <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                            Belum ada produk.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
