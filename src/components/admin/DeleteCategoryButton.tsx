"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteCategoryButton({
    categoryId,
    productCount
}: {
    categoryId: string;
    productCount: number;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (productCount > 0) {
            toast.error("Kategori tidak bisa dihapus karena masih digunakan oleh produk.");
            return;
        }

        setLoading(true);
        try {
            await deleteCategory(categoryId);
            toast.success("Kategori berhasil dihapus");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus kategori");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                        {productCount > 0
                            ? "Kategori ini masih memiliki produk terikat. Anda tidak dapat menghapusnya sampai semua produk di kategori ini dipindahkan atau dihapus."
                            : "Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white">Batal</AlertDialogCancel>
                    {productCount === 0 && (
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
