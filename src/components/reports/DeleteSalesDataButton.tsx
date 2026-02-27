"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSalesData } from "@/app/reports/actions";

export function DeleteSalesDataButton() {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!password) {
            toast.error("Password tidak boleh kosong");
            return;
        }

        setIsLoading(true);
        try {
            const result = await deleteSalesData(password);
            if (result.success) {
                toast.success("Data penjualan berhasil dihapus");
                setOpen(false);
                setPassword("");
                window.location.reload();
            } else {
                toast.error(result.error || "Gagal menghapus data");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="bg-red-600 hover:bg-red-700 text-white" title="Hapus Data Penjualan">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-red-500">Peringatan Penghapusan Data</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Tindakan ini akan menghapus <strong>seluruh riwayat transaksi</strong> dan statistik penjualan secara permanen. Data yang sudah dihapus tidak dapat dikembalikan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Masukkan Password Super Admin</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan password..."
                            className="bg-zinc-900 border-zinc-700 text-white"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-white">
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
                        {isLoading ? "Menghapus..." : "Konfirmasi Hapus"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
