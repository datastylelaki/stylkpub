"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { updateStoreSettings } from "./actions";

export default function SettingsForm({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        store_name: initialData?.store_name || "",
        store_address: initialData?.store_address || "",
        store_phone: initialData?.store_phone || "",
        bank_name: initialData?.bank_name || "",
        bank_account: initialData?.bank_account || "",
        bank_holder: initialData?.bank_holder || "",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await updateStoreSettings(formData);
            toast.success("Pengaturan toko berhasil diperbarui!");
        } catch (error: any) {
            toast.error(error.message || "Gagal memperbarui pengaturan");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Toko Info */}
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                    <h2 className="text-xl font-bold text-amber-500 mb-4">Informasi Toko</h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nama Toko</label>
                        <Input
                            value={formData.store_name}
                            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                            className="bg-background border-input focus:border-amber-500"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nomor Telepon</label>
                        <Input
                            value={formData.store_phone}
                            onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                            className="bg-background border-input focus:border-amber-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                        <Textarea
                            value={formData.store_address}
                            onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                            className="bg-background border-input focus:border-amber-500 min-h-[100px]"
                        />
                    </div>
                </div>

                {/* Pembayaran Info */}
                <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                    <h2 className="text-xl font-bold text-amber-500 mb-4">Rekening Bank</h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nama Bank</label>
                        <Input
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            className="bg-background border-input focus:border-amber-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
                        <Input
                            value={formData.bank_account}
                            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                            className="bg-background border-input focus:border-amber-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nama Pemilik</label>
                        <Input
                            value={formData.bank_holder}
                            onChange={(e) => setFormData({ ...formData, bank_holder: e.target.value })}
                            className="bg-background border-input focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>


            <div className="flex justify-end">
                <Button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-8 w-full md:w-auto shadow-lg shadow-amber-500/20"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
