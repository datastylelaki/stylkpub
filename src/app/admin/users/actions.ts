"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: "admin" | "kasir") {
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

export async function createUser(data: { email: string; password: string; name: string; role: "admin" | "kasir" }) {
    const supabase = await createClient(); // Regular client for auth check

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden: Must be an admin");

    // Use Admin Client for creation
    const adminSupabase = createAdminClient();

    // 1. Create Auth User
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto confirm
        user_metadata: { name: data.name },
    });

    if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(createError.message);
    }

    if (!newUser.user) throw new Error("Gagal membuat user auth");

    // 2. Insert into Profiles
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .upsert({
            user_id: newUser.user.id,
            name: data.name,
            role: data.role,
            created_at: new Date().toISOString(),
        });

    if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error("User dibuat tapi gagal update profil: " + profileError.message);
    }

    revalidatePath("/admin/users");
}
