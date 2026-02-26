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

    // Delete transaction items and transactions
    const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

    if (itemsError) {
        console.error("Error deleting transaction items:", itemsError);
        return { success: false, error: itemsError.message };
    }

    const { error: transError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

    if (transError) {
        console.error("Error deleting transactions:", transError);
        return { success: false, error: transError.message };
    }

    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
}
