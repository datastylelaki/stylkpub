import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import { ModeToggle } from "@/components/mode-toggle";

export default async function AdminCategoriesPage() {
    const supabase = await createClient();
    const { data: { user } = { user: null } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return <div className="p-8 text-center">Akses Ditolak: Anda bukan Admin.</div>;
    }

    // Fetch categories with product count
    // Since we can't easily do left join count in Supabase JS without RPC or extra query, we do a simple query and then count.
    const { data: categories } = await supabase
        .from("categories")
        .select("*, products(*) ")
        .order("name");

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Manajemen Kategori</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Atur kategori produk toko Anda.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products" className="flex-1 md:flex-none">
                        <Button variant="outline" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Produk
                        </Button>
                    </Link>
                    <Link href="/admin/settings" className="flex-1 md:flex-none">
                        <Button variant="outline" className="text-muted-foreground hover:text-foreground w-full">
                            Settings
                        </Button>
                    </Link>
                    <Link href="/admin/categories/new" className="flex-1 md:flex-none">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-black w-full font-bold">
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                            <TableHead className="text-muted-foreground">Nama Kategori</TableHead>
                            <TableHead className="text-muted-foreground">Jumlah Produk</TableHead>
                            <TableHead className="text-right text-muted-foreground">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories?.map((category: any) => (
                            <TableRow key={category.id} className="border-border hover:bg-muted/50">
                                <TableCell className="font-medium text-amber-500">{category.name}</TableCell>
                                <TableCell>{category.products?.length || 0} Produk</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/admin/categories/${category.id}/edit`}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100/20 dark:hover:bg-blue-900/20">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <DeleteCategoryButton
                                            categoryId={category.id}
                                            productCount={category.products?.length || 0}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {categories?.map((category: any) => (
                    <div key={category.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-amber-500">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.products?.length || 0} Produk</p>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/admin/categories/${category.id}/edit`}>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-500 border border-border">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </Link>
                            <DeleteCategoryButton
                                categoryId={category.id}
                                productCount={category.products?.length || 0}
                            />
                        </div>
                    </div>
                ))}
                {(!categories || categories.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        Belum ada kategori.
                    </div>
                )}
            </div>
        </div>
    );
}
