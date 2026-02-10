import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewProductPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch categories for the form
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8 flex items-center gap-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Tambah Produk Baru</h1>
            </div>

            <div className="w-full max-w-2xl bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                <ProductForm categories={categories || []} />
            </div>
        </div>
    );
}
