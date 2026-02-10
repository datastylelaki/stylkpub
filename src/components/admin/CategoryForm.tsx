"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CategoryFormValues, createCategory, updateCategory } from "@/app/admin/categories/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Category } from "@/types/database";

const formSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
});

interface CategoryFormProps {
    initialData?: Category;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
        },
    });

    async function onSubmit(values: CategoryFormValues) {
        setLoading(true);
        try {
            if (initialData) {
                await updateCategory(initialData.id, values);
                toast.success("Kategori berhasil diperbarui");
            } else {
                await createCategory(values);
                toast.success("Kategori berhasil dibuat");
            }
            router.push("/admin/categories");
            router.refresh();
        } catch (error) {
            toast.error("Gagal menyimpan kategori");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Kategori</FormLabel>
                            <FormControl>
                                <Input placeholder="Contoh: Kemeja Panjang" {...field} className="bg-zinc-900 border-zinc-800" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                    ) : (
                        "Simpan Kategori"
                    )}
                </Button>
            </form>
        </Form>
    );
}
