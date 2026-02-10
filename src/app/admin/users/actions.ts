"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Helper: Verify the current user is an admin
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");
    return { supabase, user };
}

// ── Update Role ──
export async function updateUserRole(userId: string, role: "admin" | "kasir") {
    const { supabase } = await verifyAdmin();

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

// ── Create User ──
export async function createUser(data: { email: string; password: string; name: string; role: "admin" | "kasir" }) {
    await verifyAdmin();
    const adminSupabase = createAdminClient();

    // 1. Create Auth User
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.name },
    });

    if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(createError.message);
    }

    if (!newUser.user) throw new Error("Gagal membuat user auth");

    // 2. Update the profile created by the trigger with the correct role
    // (The trigger auto-creates a profile with role 'kasir', so we update it)
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .update({ name: data.name, role: data.role })
        .eq("user_id", newUser.user.id);

    if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error("User dibuat tapi gagal update profil: " + profileError.message);
    }

    revalidatePath("/admin/users");
}

// ── Edit User ──
export async function editUser(userId: string, data: { name: string; role: "admin" | "kasir"; newPassword?: string }) {
    await verifyAdmin();
    const adminSupabase = createAdminClient();

    // 1. Update profile
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .update({ name: data.name, role: data.role })
        .eq("user_id", userId);

    if (profileError) {
        console.error("Error updating profile:", profileError);
        throw new Error("Gagal mengupdate profil: " + profileError.message);
    }

    // 2. Update password if provided
    if (data.newPassword) {
        const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
            password: data.newPassword,
        });

        if (authError) {
            console.error("Error updating password:", authError);
            throw new Error("Profil diupdate, tapi gagal ubah password: " + authError.message);
        }
    }

    revalidatePath("/admin/users");
}

// ── Delete User ──
export async function deleteUser(userId: string) {
    const { user } = await verifyAdmin();

    // Prevent self-deletion
    if (userId === user.id) {
        throw new Error("Anda tidak bisa menghapus akun sendiri!");
    }

    const adminSupabase = createAdminClient();

    // 1. Delete profile first
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

    if (profileError) {
        console.error("Error deleting profile:", profileError);
        throw new Error("Gagal menghapus profil: " + profileError.message);
    }

    // 2. Delete auth user
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authError) {
        console.error("Error deleting auth user:", authError);
        throw new Error("Profil dihapus, tapi gagal hapus akun auth: " + authError.message);
    }

    revalidatePath("/admin/users");
}
