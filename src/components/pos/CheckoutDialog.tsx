"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CartItem, Profile, StoreSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Banknote,
    QrCode,
    Loader2,
    CheckCircle2,
    Printer,
    Tag,
} from "lucide-react";
import { usePrinter } from "@/components/PrinterProvider";
import type { ReceiptData } from "@/lib/thermal-printer";

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: CartItem[];
    total: number;
    profile: Profile | null;
    onSuccess: () => void;
    onStockUpdate: (soldItems: { variantId: string; quantity: number }[]) => void;
    formatRupiah: (amount: number) => string;
}

type PaymentMethod = "cash" | "qris";

const TEBUS_HARGA = 25_000;
const TEBUS_MIN = 200_000;

export default function CheckoutDialog({
    open,
    onOpenChange,
    cart,
    total,
    profile,
    onSuccess,
    onStockUpdate,
    formatRupiah,
}: CheckoutDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [cashReceived, setCashReceived] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [tebusQty, setTebusQty] = useState(0);
    const supabase = createClient();
    const { connected: printerConnected, printing, print, connect: connectBT } = usePrinter();

    useEffect(() => {
        supabase.from("store_settings").select("*").single().then(({ data }) => {
            if (data) setStoreSettings(data);
        });
    }, [supabase]);

    useEffect(() => {
        if (total < TEBUS_MIN) setTebusQty(0);
    }, [total]);

    const grandTotal = total + tebusQty * TEBUS_HARGA;

    const changeAmount = paymentMethod === "cash"
        ? Math.max(0, Number(cashReceived) - grandTotal)
        : 0;

    const canProceed = paymentMethod === "cash"
        ? Number(cashReceived) >= grandTotal
        : true;

    async function handleCheckout() {
        if (!profile) {
            toast.error("Profile tidak ditemukan");
            return;
        }

        setLoading(true);

        try {
            // REAL-TIME STOCK VALIDATION: Verify stock before checkout
            const variantIds = cart.map(item => item.variant.id);
            const { data: currentVariants, error: stockError } = await supabase
                .from("product_variants")
                .select("id, stock")
                .in("id", variantIds);

            if (stockError) throw stockError;

            // Check if any item in cart exceeds current stock
            for (const cartItem of cart) {
                const currentVariant = currentVariants?.find(v => v.id === cartItem.variant.id);
                if (!currentVariant) {
                    toast.error(`Produk ${cartItem.variant.product.name} tidak ditemukan`);
                    setLoading(false);
                    return;
                }
                if (cartItem.quantity > currentVariant.stock) {
                    toast.error(`Stok ${cartItem.variant.product.name} tidak cukup! Tersisa: ${currentVariant.stock}`);
                    setLoading(false);
                    return;
                }
            }

            // Create transaction
            const { data: transaction, error: txError } = await supabase
                .from("transactions")
                .insert({
                    cashier_id: profile.id,
                    total: grandTotal,
                    payment_method: paymentMethod,
                    cash_received: paymentMethod === "cash" ? Number(cashReceived) : grandTotal,
                    change_amount: changeAmount,
                })
                .select()
                .single();

            if (txError) throw txError;

            // Build transaction items
            const items: {
                transaction_id: string;
                variant_id: string | null;
                product_name: string;
                variant_info: string | null;
                quantity: number;
                price: number;
            }[] = cart.map((item) => ({
                transaction_id: transaction.id,
                variant_id: item.variant.id,
                product_name: item.variant.product.name,
                variant_info: `${item.variant.size} / ${item.variant.color}`,
                quantity: item.quantity,
                price: item.variant.product.base_price,
            }));

            if (tebusQty > 0) {
                items.push({
                    transaction_id: transaction.id,
                    variant_id: null,
                    product_name: "Tebus Murah",
                    variant_info: null,
                    quantity: tebusQty,
                    price: TEBUS_HARGA,
                });
            }

            const { error: itemsError } = await supabase
                .from("transaction_items")
                .insert(items);

            if (itemsError) throw itemsError;

            setTransactionId(transaction.id);
            setSuccess(true);
            toast.success("Transaksi berhasil!");

            // Optimistic stock update — update UI immediately without page refresh
            onStockUpdate(cart.map(item => ({
                variantId: item.variant.id,
                quantity: item.quantity,
            })));
        } catch (error) {
            console.error(error);
            toast.error("Gagal memproses transaksi");
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        if (success) {
            onSuccess();
            setSuccess(false);
            setTransactionId(null);
            setCashReceived("");
            setPaymentMethod("cash");
            setTebusQty(0);
        }
        onOpenChange(false);
    }

    async function handlePrint() {
        if (!printerConnected) {
            try {
                toast.info("Menghubungkan printer...");
                await connectBT();
                toast.success("Printer terhubung!");
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Gagal menghubungkan printer";
                toast.error(msg);
                return;
            }
        }

        const receiptData: ReceiptData = {
            storeName: storeSettings?.store_name || "STYLK",
            storeAddress: storeSettings?.store_address || undefined,
            storePhone: storeSettings?.store_phone || undefined,
            receiptFooter: storeSettings?.receipt_footer || undefined,
            items: [
                ...cart.map((item) => ({
                    name: item.variant.product.name,
                    variantInfo: `${item.variant.size} / ${item.variant.color}`,
                    quantity: item.quantity,
                    price: item.variant.product.base_price,
                })),
                ...(tebusQty > 0 ? [{
                    name: "Tebus Murah",
                    variantInfo: null,
                    quantity: tebusQty,
                    price: TEBUS_HARGA,
                }] : []),
            ],
            total: grandTotal,
            paymentMethod,
            cashReceived: paymentMethod === "cash" ? Number(cashReceived) : undefined,
            changeAmount: paymentMethod === "cash" ? changeAmount : undefined,
            cashierName: profile?.name || "Kasir",
            transactionId: transactionId || "-",
            date: new Date(),
        };

        try {
            await print(receiptData);
            toast.success("Struk berhasil dicetak!");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Gagal mencetak struk";
            toast.error(msg);
        }
    }

    // Quick cash buttons
    const quickCashAmounts = [50000, 100000, 150000, 200000];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>{success ? "Transaksi Berhasil" : "Pembayaran"}</DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-500">{formatRupiah(grandTotal)}</p>
                            {paymentMethod === "cash" && changeAmount > 0 && (
                                <p className="text-zinc-400">Kembalian: {formatRupiah(changeAmount)}</p>
                            )}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                disabled={printing}
                                className={`border-zinc-700 bg-zinc-800 ${printerConnected ? "" : "opacity-60"}`}
                            >
                                {printing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Printer className="w-4 h-4 mr-2" />
                                )}
                                {printing ? "Mencetak..." : "Cetak Struk"}
                            </Button>
                        </div>
                        <Button
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold"
                            onClick={handleClose}
                        >
                            Selesai
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Total */}
                        <div className="text-center py-4 bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-400">Total Pembayaran</p>
                            <p className="text-3xl font-bold text-amber-500">{formatRupiah(grandTotal)}</p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={paymentMethod === "cash" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("cash")}
                                    className={paymentMethod === "cash"
                                        ? "bg-amber-500 text-black"
                                        : "border-zinc-700 bg-zinc-800"
                                    }
                                >
                                    <Banknote className="w-4 h-4 mr-2" />
                                    Cash
                                </Button>
                                <Button
                                    variant={paymentMethod === "qris" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("qris")}
                                    className={paymentMethod === "qris"
                                        ? "bg-amber-500 text-black"
                                        : "border-zinc-700 bg-zinc-800"
                                    }
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    QRIS
                                </Button>
                            </div>
                        </div>

                        {/* Tebus Murah */}
                        {total >= TEBUS_MIN && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-amber-500" />
                                        <span className="font-semibold text-amber-400">Tebus Murah</span>
                                    </div>
                                    <span className="text-sm text-zinc-400">{formatRupiah(TEBUS_HARGA)}/pcs</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 border-zinc-600 bg-zinc-800"
                                            onClick={() => setTebusQty(q => Math.max(0, q - 1))}
                                            disabled={tebusQty === 0}
                                        >
                                            −
                                        </Button>
                                        <span className="w-6 text-center font-bold text-lg">{tebusQty}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 border-zinc-600 bg-zinc-800"
                                            onClick={() => setTebusQty(q => q + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                    {tebusQty > 0 && (
                                        <span className="text-amber-400 font-semibold">
                                            {formatRupiah(tebusQty * TEBUS_HARGA)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Cash Input */}
                        {paymentMethod === "cash" && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="cash">Uang Diterima</Label>
                                    <Input
                                        id="cash"
                                        type="number"
                                        placeholder="0"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 text-white text-lg"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {quickCashAmounts.map((amount) => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCashReceived(amount.toString())}
                                            className="border-zinc-700 bg-zinc-800"
                                        >
                                            {formatRupiah(amount)}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCashReceived(grandTotal.toString())}
                                        className="border-zinc-700 bg-zinc-800"
                                    >
                                        Uang Pas
                                    </Button>
                                </div>
                                {Number(cashReceived) >= grandTotal && (
                                    <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center">
                                        Kembalian: <span className="font-bold">{formatRupiah(changeAmount)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* QRIS */}
                        {paymentMethod === "qris" && (
                            <div className="bg-zinc-800 p-6 rounded-lg text-center space-y-3">
                                <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <QrCode className="w-8 h-8 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-white mb-1">Pembayaran QRIS</p>
                                    <p className="text-sm text-zinc-400">Silakan scan QRIS di kasir.</p>
                                    <p className="text-sm text-zinc-400">Klik "Konfirmasi" setelah pembayaran berhasil.</p>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-zinc-700" />

                        {/* Checkout Button */}
                        <Button
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                            disabled={!canProceed || loading}
                            onClick={handleCheckout}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Konfirmasi Pembayaran"
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
