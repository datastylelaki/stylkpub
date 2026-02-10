"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: "admin" | "cashier") {
    const supabase = await createClient();

    // Verify Admin (Current User must be admin)
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");

    // Update target user role
    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId);

    if (error) {
        console.error("Error updating user role:", error);
        throw new Error("Gagal mengubah role user");
    }

    revalidatePath("/admin/users");
}
