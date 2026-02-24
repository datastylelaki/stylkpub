"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createProduct, updateProduct, ProductFormValues } from "@/app/admin/products/actions";
import { Category, Product, ProductVariant } from "@/types/database";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const variantSchema = z.object({
    size: z.string().min(1, "Size required"),
    color: z.string().min(1, "Color required"),
    stock: z.coerce.number().min(0, "Stock >= 0"),
});

const formSchema = z.object({
    name: z.string().min(2, "Name required"),
    category_id: z.string().uuid("Select category"),
    base_price: z.coerce.number().min(0, "Price >= 0"),
    image_url: z.string().optional(),
    variants: z.array(variantSchema).min(1, "Need 1 variant"),
});

interface ProductFormProps {
    categories: Category[];
    initialData?: Product & { variants: ProductVariant[] };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const defaultValues = initialData ? {
        name: initialData.name,
        category_id: initialData.category_id || "",
        base_price: initialData.base_price,
        image_url: initialData.image_url || "",
        variants: initialData.variants.map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock
        }))
    } : {
        name: "",
        base_price: 0,
        category_id: "",
        image_url: "",
        variants: [{ size: "M", color: "Hitam", stock: 10 }],
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: defaultValues as any,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants"
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            if (initialData) {
                await updateProduct(initialData.id, values);
                toast.success("Produk berhasil diperbarui!");
            } else {
                await createProduct(values);
                toast.success("Produk berhasil dibuat!");
            }
            router.refresh();
        } catch (error) {
            toast.error(initialData ? "Gagal update produk" : "Gagal membuat produk");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Produk</FormLabel>
                            <FormControl>
                                <Input placeholder="Kemeja Keren" {...field} className="bg-background border-input" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kategori</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background border-input">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background border-input">
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="base_price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Harga Dasar (Rp)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="100000" {...field} className="bg-background border-input" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <FormLabel>Foto Produk</FormLabel>
                    <div className="flex items-center gap-4">
                        {form.watch("image_url") && (
                            <img
                                src={form.watch("image_url")}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg border border-input"
                            />
                        )}
                        <div className="flex-1">
                            <Input
                                type="file"
                                accept="image/*"
                                className="bg-background border-input cursor-pointer"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const { uploadProductImage } = await import("@/app/admin/products/actions");
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        toast.info("Mengupload gambar...");
                                        try {
                                            const publicUrl = await uploadProductImage(formData);
                                            form.setValue("image_url", publicUrl);
                                            toast.success("Gambar berhasil diupload");
                                        } catch (error: any) {
                                            toast.error(error.message || "Gagal upload gambar");
                                            console.error(error);
                                        }
                                    }
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Format: JPG, PNG. Max 5MB.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-lg font-semibold">Varian Produk</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ size: "", color: "", stock: 0 })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Tambah Varian
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border border-input rounded-lg bg-muted/50 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
                            <div className="grid grid-cols-2 md:contents gap-4">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.size`}
                                    render={({ field }) => (
                                        <FormItem className="md:flex-1">
                                            <FormLabel className="text-xs text-muted-foreground">Size</FormLabel>
                                            <FormControl>
                                                <Input placeholder="XL" {...field} className="h-10 md:h-8 bg-background border-input focus:border-amber-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.color`}
                                    render={({ field }) => (
                                        <FormItem className="md:flex-1">
                                            <FormLabel className="text-xs text-muted-foreground">Warna</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Merah" {...field} className="h-10 md:h-8 bg-background border-input focus:border-amber-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex items-end gap-4">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.stock`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-xs text-muted-foreground">Stok</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="10" {...field} className="h-10 md:h-8 bg-background border-input focus:border-amber-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="h-10 w-10 md:h-8 md:w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20 border border-input md:border-none"
                                    disabled={fields.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                    ) : (
                        "Simpan Produk"
                    )}
                </Button>
            </form>
        </Form>
    );
}
