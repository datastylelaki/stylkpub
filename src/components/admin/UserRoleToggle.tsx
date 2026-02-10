"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateUserRole } from "@/app/admin/users/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserRoleToggleProps {
    userId: string;
    initialRole: "admin" | "cashier";
    isCurrentUser: boolean;
}

export function UserRoleToggle({ userId, initialRole, isCurrentUser }: UserRoleToggleProps) {
    const [role, setRole] = useState(initialRole);
    const [loading, setLoading] = useState(false);

    const isAdmin = role === "admin";

    async function handleToggle(checked: boolean) {
        if (isCurrentUser) {
            toast.error("Anda tidak bisa mengubah role Anda sendiri!");
            return;
        }

        const newRole = checked ? "admin" : "cashier";
        setLoading(true);
        try {
            await updateUserRole(userId, newRole);
            setRole(newRole);
            toast.success(`Role berhasil diubah menjadi ${newRole}`);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengubah role");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id={`role-${userId}`}
                checked={isAdmin}
                onCheckedChange={handleToggle}
                disabled={loading || isCurrentUser}
                className="data-[state=checked]:bg-amber-500"
            />
            <Label htmlFor={`role-${userId}`} className="text-sm font-medium">
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                ) : (
                    isAdmin ? "Admin" : "Kasir"
                )}
            </Label>
        </div>
    );
}
