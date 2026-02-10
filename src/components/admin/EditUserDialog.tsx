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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { editUser } from "@/app/admin/users/actions";

interface EditUserDialogProps {
    userId: string;
    currentName: string;
    currentRole: "admin" | "kasir";
    isCurrentUser: boolean;
}

export function EditUserDialog({ userId, currentName, currentRole, isCurrentUser }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: currentName,
        role: currentRole,
        newPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await editUser(userId, {
                name: formData.name,
                role: isCurrentUser ? currentRole : formData.role, // Can't change own role
                newPassword: formData.newPassword || undefined,
            });
            toast.success(`User ${formData.name} berhasil diupdate!`);
            setOpen(false);
            setFormData({ ...formData, newPassword: "" });
        } catch (error: any) {
            toast.error(error.message || "Gagal mengupdate user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Ubah nama, role, atau reset password user.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nama Lengkap</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role / Hak Akses</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val: "admin" | "kasir") =>
                                    setFormData({ ...formData, role: val })
                                }
                                disabled={isCurrentUser}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kasir">Kasir (Terbatas)</SelectItem>
                                    <SelectItem value="admin">Admin (Full Akses)</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCurrentUser && (
                                <p className="text-xs text-muted-foreground">Anda tidak bisa mengubah role sendiri.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, newPassword: e.target.value })
                                }
                                placeholder="Kosongkan jika tidak diubah"
                                minLength={6}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
