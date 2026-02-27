"use client";

import { useState } from "react";
import { StoreSettings, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Printer, Store, UserCog } from "lucide-react";
import { saveStoreSettings, updateCashierName } from "@/app/admin/settings/actions";

interface ReceiptSettingsFormProps {
    settings: StoreSettings | null;
    profile: Profile;
}

export function ReceiptSettingsForm({ settings, profile }: ReceiptSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);
    const [storeName, setStoreName] = useState(settings?.store_name || "");
    const [storeAddress, setStoreAddress] = useState(settings?.store_address || "");
    const [storePhone, setStorePhone] = useState(settings?.store_phone || "");
    const [receiptFooter, setReceiptFooter] = useState(
        settings?.receipt_footer || "Barang yang sudah dibeli\ntidak dapat ditukar/retur"
    );
    const [cashierName, setCashierName] = useState(profile?.name || "");

    async function handleSave() {
        setLoading(true);
        try {
            await saveStoreSettings({
                id: settings?.id,
                store_name: storeName,
                store_address: storeAddress || null,
                store_phone: storePhone || null,
                receipt_footer: receiptFooter || null,
            });

            toast.success("Pengaturan berhasil disimpan!");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveName() {
        if (!cashierName.trim()) {
            toast.error("Nama tidak boleh kosong");
            return;
        }
        setNameLoading(true);
        try {
            await updateCashierName(cashierName.trim());
            toast.success("Nama berhasil diperbarui!");
        } catch (error) {
            console.error(error);
            toast.error("Gagal memperbarui nama");
        } finally {
            setNameLoading(false);
        }
    }

    return (
        <div className="grid gap-6 max-w-2xl">
            {/* Cashier Name */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-amber-500" />
                        Profil Kasir
                    </CardTitle>
                    <CardDescription>Nama yang ditampilkan di struk dan aplikasi POS.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cashierName">Nama Kasir</Label>
                        <div className="flex gap-2">
                            <Input
                                id="cashierName"
                                value={cashierName}
                                onChange={(e) => setCashierName(e.target.value)}
                                placeholder="Nama Anda"
                                className="bg-muted/50 border-input"
                            />
                            <Button
                                onClick={handleSaveName}
                                disabled={nameLoading || !cashierName.trim() || cashierName === profile?.name}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
                            >
                                {nameLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Store Info */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-amber-500" />
                        Informasi Toko
                    </CardTitle>
                    <CardDescription>Data ini akan tampil di header struk.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="storeName">Nama Toko</Label>
                        <Input
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="STYLK Fashion"
                            className="bg-muted/50 border-input"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storeAddress">Alamat</Label>
                        <Input
                            id="storeAddress"
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            placeholder="Jl. Contoh No. 123"
                            className="bg-muted/50 border-input"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storePhone">Telepon</Label>
                        <Input
                            id="storePhone"
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            placeholder="081234567890"
                            className="bg-muted/50 border-input"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Receipt Settings */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-amber-500" />
                        Pengaturan Struk
                    </CardTitle>
                    <CardDescription>Sesuaikan tampilan struk thermal printer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="receiptFooter">Footer Struk</Label>
                        <Textarea
                            id="receiptFooter"
                            value={receiptFooter}
                            onChange={(e) => setReceiptFooter(e.target.value)}
                            placeholder={"Barang yang sudah dibeli\ntidak dapat ditukar/retur"}
                            rows={3}
                            className="bg-muted/50 border-input resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Teks ini akan tampil di bagian bawah struk.</p>
                    </div>

                    {/* Receipt Preview */}
                    <div className="space-y-2">
                        <Label>Preview Struk</Label>
                        <div className="bg-white text-black p-4 rounded-lg font-mono text-xs leading-relaxed max-w-[300px]">
                            <div className="text-center font-bold text-sm">{storeName || "STYLK"}</div>
                            {storeAddress && <div className="text-center">{storeAddress}</div>}
                            {storePhone && <div className="text-center">{storePhone}</div>}
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div>Tgl : 27/02/2026 14:30</div>
                            <div>No  : ABC12345</div>
                            <div>Kasir: {cashierName || "Admin"}</div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div>Kaos Polos Basic</div>
                            <div className="flex justify-between">
                                <span>  1x Rp89.000</span>
                                <span>Rp89.000</span>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div className="flex justify-between font-bold">
                                <span>TOTAL</span>
                                <span>Rp89.000</span>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div className="flex justify-between">
                                <span>Bayar</span>
                                <span>TUNAI</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Diterima</span>
                                <span>Rp100.000</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembalian</span>
                                <span>Rp11.000</span>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div className="text-center mt-2">Terima kasih telah</div>
                            <div className="text-center">berbelanja di {storeName || "STYLK"}!</div>
                            {receiptFooter && (
                                <div className="text-center mt-1">
                                    {receiptFooter.split("\n").map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSave}
                disabled={loading || !storeName}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Pengaturan
            </Button>
        </div>
    );
}
