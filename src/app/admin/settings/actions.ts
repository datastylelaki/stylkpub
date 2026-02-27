"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveStoreSettings(data: {
    id?: string;
    store_name: string;
    store_address: string | null;
    store_phone: string | null;
    receipt_footer: string | null;
}) {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");

    if (data.id) {
        const { error } = await supabase
            .from("store_settings")
            .update({
                store_name: data.store_name,
                store_address: data.store_address,
                store_phone: data.store_phone,
                receipt_footer: data.receipt_footer,
            })
            .eq("id", data.id);

        if (error) {
            console.error("Error updating store settings:", error);
            throw new Error("Failed to update settings");
        }
    } else {
        const { error } = await supabase
            .from("store_settings")
            .insert({
                store_name: data.store_name,
                store_address: data.store_address,
                store_phone: data.store_phone,
                receipt_footer: data.receipt_footer,
            });

        if (error) {
            console.error("Error creating store settings:", error);
            throw new Error("Failed to create settings");
        }
    }

    revalidatePath("/admin/settings");
}
