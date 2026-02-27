"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Helper: Verify the current user is an admin
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");
    return { supabase, user };
}

export async function saveStoreSettings(data: {
    id?: string;
    store_name: string;
    store_address: string | null;
    store_phone: string | null;
    receipt_footer: string | null;
    qris_image_url: string | null;
    marketing_budget: number;
}) {
    await verifyAdmin();
    const adminSupabase = createAdminClient();

    if (data.id) {
        // Update existing row
        const { error } = await adminSupabase
            .from("store_settings")
            .update({
                store_name: data.store_name,
                store_address: data.store_address,
                store_phone: data.store_phone,
                receipt_footer: data.receipt_footer,
                qris_image_url: data.qris_image_url,
                marketing_budget: data.marketing_budget,
                updated_at: new Date().toISOString(),
            })
            .eq("id", data.id);

        if (error) {
            console.error("Error updating store settings:", error);
            throw new Error(error.message);
        }
    } else {
        // Insert new row — include all required fields
        const { error } = await adminSupabase
            .from("store_settings")
            .insert({
                store_name: data.store_name,
                store_address: data.store_address,
                store_phone: data.store_phone,
                receipt_footer: data.receipt_footer,
                qris_image_url: data.qris_image_url,
                marketing_budget: data.marketing_budget,
                bank_name: "",
            });

        if (error) {
            console.error("Error creating store settings:", error);
            throw new Error(error.message);
        }
    }

    revalidatePath("/admin/settings");
}

export async function updateCashierName(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
        .from("profiles")
        .update({ name })
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating cashier name:", error);
        throw new Error("Failed to update name: " + error.message);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
}
