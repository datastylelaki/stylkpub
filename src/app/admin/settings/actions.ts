"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStoreSettings() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .single();

    if (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
    return data;
}

export async function updateStoreSettings(data: {
    store_name: string;
    store_address: string;
    store_phone: string;
    bank_name: string;
    bank_account: string;
    bank_holder: string;
    qris_image_url?: string;
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

    // Update (assuming single row exists)
    // We get the ID first or just update since RLS and table structure imply single row management usually.
    const { data: current } = await supabase.from("store_settings").select("id").single();

    const { error } = await supabase
        .from("store_settings")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", current?.id);

    if (error) {
        console.error("Error updating settings:", error);
        throw new Error("Gagal memperbarui pengaturan toko");
    }

    revalidatePath("/admin/settings");
    revalidatePath("/"); // Update POS title if used
    return { success: true };
}
