"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/app/admin/users/actions";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
    isCurrentUser: boolean;
}

export function DeleteUserButton({ userId, userName, isCurrentUser }: DeleteUserButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteUser(userId);
            toast.success(`User ${userName} berhasil dihapus.`);
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus user");
        } finally {
            setLoading(false);
        }
    }

    if (isCurrentUser) return null; // Can't delete yourself

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus User</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus user <strong className="text-amber-500">{userName}</strong>?
                        Akun ini akan dihapus secara permanen dan tidak bisa login lagi.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Hapus User
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
