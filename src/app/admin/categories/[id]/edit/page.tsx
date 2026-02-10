import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditCategoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCategoryPage(props: EditCategoryPageProps) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } = { user: null } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch category
    const { data: category } = await supabase
        .from("categories")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!category) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
            <div className="w-full max-w-md mb-8 flex items-center gap-4">
                <Link href="/admin/categories">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Edit Kategori</h1>
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                <CategoryForm initialData={category} />
            </div>
        </div>
    );
}
