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

export async function deleteTransaction(transactionId: string) {
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

    // Fetch transaction items to restore stock
    const { data: items, error: fetchError } = await supabase
        .from("transaction_items")
        .select("variant_id, quantity")
        .eq("transaction_id", transactionId);

    if (fetchError) {
        console.error("Error fetching transaction items:", fetchError);
        return { success: false, error: `Gagal ambil data item: ${fetchError.message}` };
    }

    // Restore stock for each item
    for (const item of items || []) {
        if (item.variant_id) {
            // Get current stock
            const { data: variant } = await supabase
                .from("product_variants")
                .select("stock")
                .eq("id", item.variant_id)
                .single();

            if (variant) {
                const { error: stockError } = await supabase
                    .from("product_variants")
                    .update({ stock: variant.stock + item.quantity })
                    .eq("id", item.variant_id);

                if (stockError) {
                    console.error("Error restoring stock:", stockError);
                }
            }
        }
    }

    // Delete transaction items (foreign key dependency)
    const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", transactionId);

    if (itemsError) {
        console.error("Error deleting transaction items:", itemsError);
        return { success: false, error: `Gagal hapus item: ${itemsError.message}` };
    }

    // Delete the transaction
    const { error: transError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

    if (transError) {
        console.error("Error deleting transaction:", transError);
        return { success: false, error: `Gagal hapus transaksi: ${transError.message}` };
    }

    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
}
