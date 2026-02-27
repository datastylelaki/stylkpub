"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteSalesData(password: string) {
    if (password !== "mindjo") {
        return { success: false, error: "Password salah!" };
    }

    const supabase = await createClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { success: false, error: "Tindakan ini hanya untuk Admin" };
    }

    // Delete transaction items first (foreign key dependency)
    const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .gte("created_at", "1970-01-01");

    if (itemsError) {
        console.error("Error deleting transaction items:", itemsError);
        return { success: false, error: `Gagal hapus item: ${itemsError.message}. Pastikan RLS DELETE policy sudah ditambahkan.` };
    }

    const { error: transError } = await supabase
        .from("transactions")
        .delete()
        .gte("created_at", "1970-01-01");

    if (transError) {
        console.error("Error deleting transactions:", transError);
        return { success: false, error: `Gagal hapus transaksi: ${transError.message}. Pastikan RLS DELETE policy sudah ditambahkan.` };
    }

    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
}
