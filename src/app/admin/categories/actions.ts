"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export async function createCategory(data: CategoryFormValues) {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");

    const { error } = await supabase
        .from("categories")
        .insert({
            name: data.name,
        });

    if (error) {
        console.error("Error creating category:", error);
        throw new Error("Gagal membuat kategori");
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products"); // Categories are used in products
    revalidatePath("/");
}

export async function updateCategory(id: string, data: CategoryFormValues) {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");

    const { error } = await supabase
        .from("categories")
        .update({
            name: data.name,
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating category:", error);
        throw new Error("Gagal update kategori");
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Forbidden");

    // Check if categories are used by products
    const { count, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id);

    if (count && count > 0) {
        throw new Error("Kategori tidak bisa dihapus karena masih digunakan oleh produk.");
    }

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting category:", error);
        throw new Error("Gagal menghapus kategori");
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
}
