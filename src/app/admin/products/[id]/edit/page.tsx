import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage(props: EditProductPageProps) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    // Fetch product with variants
    const { data: product } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("id", params.id)
        .single();

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8 flex items-center gap-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Edit Produk</h1>
            </div>

            <div className="w-full max-w-2xl bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                <ProductForm categories={categories || []} initialData={product} />
            </div>
        </div>
    );
}
