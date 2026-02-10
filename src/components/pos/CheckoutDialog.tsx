"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CartItem, Profile } from "@/types/database";
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
    MessageCircle
} from "lucide-react";

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: CartItem[];
    total: number;
    profile: Profile | null;
    onSuccess: () => void;
    formatRupiah: (amount: number) => string;
}

type PaymentMethod = "cash" | "qris";

export default function CheckoutDialog({
    open,
    onOpenChange,
    cart,
    total,
    profile,
    onSuccess,
    formatRupiah,
}: CheckoutDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [cashReceived, setCashReceived] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const supabase = createClient();

    const changeAmount = paymentMethod === "cash"
        ? Math.max(0, Number(cashReceived) - total)
        : 0;

    const canProceed = paymentMethod === "cash"
        ? Number(cashReceived) >= total
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
                    total,
                    payment_method: paymentMethod,
                    cash_received: paymentMethod === "cash" ? Number(cashReceived) : total,
                    change_amount: changeAmount,
                })
                .select()
                .single();

            if (txError) throw txError;

            // Create transaction items
            const items = cart.map((item) => ({
                transaction_id: transaction.id,
                variant_id: item.variant.id,
                product_name: item.variant.product.name,
                variant_info: `${item.variant.size} / ${item.variant.color}`,
                quantity: item.quantity,
                price: item.variant.product.base_price,
            }));

            const { error: itemsError } = await supabase
                .from("transaction_items")
                .insert(items);

            if (itemsError) throw itemsError;

            setTransactionId(transaction.id);
            setSuccess(true);
            toast.success("Transaksi berhasil!");
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
        }
        onOpenChange(false);
    }

    function handlePrint() {
        // TODO: Implement thermal print
        toast.info("Fitur cetak struk akan segera hadir");
    }

    function handleWhatsApp() {
        const lines = [
            "🛍️ *STYLK Fashion*",
            "------------------------",
            ...cart.map(
                (item) =>
                    `${item.variant.product.name} (${item.variant.size}/${item.variant.color}) x${item.quantity} = ${formatRupiah(item.variant.product.base_price * item.quantity)}`
            ),
            "------------------------",
            `*Total: ${formatRupiah(total)}*`,
            `Bayar: ${paymentMethod.toUpperCase()}`,
            "",
            "Terima kasih telah berbelanja di STYLK! 🙏",
        ];

        const text = encodeURIComponent(lines.join("\n"));
        window.open(`https://wa.me/?text=${text}`, "_blank");
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
                            <p className="text-2xl font-bold text-amber-500">{formatRupiah(total)}</p>
                            {paymentMethod === "cash" && changeAmount > 0 && (
                                <p className="text-zinc-400">Kembalian: {formatRupiah(changeAmount)}</p>
                            )}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="border-zinc-700 bg-zinc-800"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak Struk
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleWhatsApp}
                                className="border-zinc-700 bg-zinc-800"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                WhatsApp
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
                            <p className="text-3xl font-bold text-amber-500">{formatRupiah(total)}</p>
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
                                        onClick={() => setCashReceived(total.toString())}
                                        className="border-zinc-700 bg-zinc-800"
                                    >
                                        Uang Pas
                                    </Button>
                                </div>
                                {Number(cashReceived) >= total && (
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
