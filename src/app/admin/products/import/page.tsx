"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { bulkImportProducts } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Upload, FileJson, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminImportPage() {
    const [csvData, setCsvData] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploadProgress, setUploadProgress] = useState("");
    const router = useRouter();
    const supabase = createClient();

    async function handleImport() {
        if (!csvData.trim()) return toast.error("Data CSV masih kosong");

        setLoading(true);
        setUploadProgress("Menganalisis data...");
        try {
            const lines = csvData.trim().split("\n");
            // Determine columns by header if possible, else standard
            const headerLine = lines[0].toLowerCase();
            const hasHeader = headerLine.includes("category");
            const startIdx = hasHeader ? 1 : 0;

            const rows = [];
            const filesMap = new Map<string, File>();

            // Pre-process files
            if (selectedFiles) {
                Array.from(selectedFiles).forEach(f => filesMap.set(f.name, f));
            }

            for (let i = startIdx; i < lines.length; i++) {
                const parts = lines[i].split(",");
                if (parts.length < 6) continue;

                // Standard: Category, Name, Price, Size, Color, Stock, [Image]
                const [category, product_name, base_price, size, color, stock, image] = parts.map(v => v?.trim());

                if (!category || !product_name) continue;

                let finalImageUrl = image || "";

                // Handle Image Upload logic
                if (image && !image.startsWith("http")) {
                    const file = filesMap.get(image);
                    if (file) {
                        setUploadProgress(`Mengupload gambar: ${image}...`);

                        try {
                            const { uploadProductImage } = await import("../actions");
                            const formData = new FormData();
                            formData.append('file', file);

                            const publicUrl = await uploadProductImage(formData);
                            finalImageUrl = publicUrl;
                        } catch (error) {
                            console.error(`Gagal upload ${image}:`, error);
                            // We continue even if image fails, just logging it.
                        }
                    }
                }

                rows.push({
                    category,
                    product_name,
                    base_price: Number(base_price) || 0,
                    size: size || "-",
                    color: color || "-",
                    stock: Number(stock) || 0,
                    image_url: finalImageUrl
                });
            }

            if (rows.length === 0) throw new Error("Tidak ada data valid.");

            setUploadProgress("Menyimpan produk ke database...");
            const results = await bulkImportProducts(rows);

            if (results.errors.length > 0) {
                toast.warning(`Berhasil impor ${results.productsCreated} produk, tapi ada error pada ${results.errors.length} item.`);
                console.error(results.errors);
            } else {
                toast.success(`Berhasil! ${results.productsCreated} produk & ${results.variantsCreated} varian.`);
                router.push("/admin/products");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Gagal mengimpor data");
        } finally {
            setLoading(false);
            setUploadProgress("");
        }
    }

    function downloadTemplate() {
        // Create CSV template with header and example data
        const template = `Category,Name,Price,Size,Color,Stock,Image
Kemeja,Kemeja Premium,100000,M,Hitam,10,kemeja-hitam.jpg
Kemeja,Kemeja Premium,100000,L,Hitam,5,kemeja-hitam.jpg
Celana,Celana Jeans,150000,30,Biru,8,celana-biru.jpg
Celana,Celana Jeans,150000,32,Biru,12,celana-biru.jpg`;

        // Create blob and download
        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'template_import_produk.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Template CSV berhasil didownload");
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-amber-500">Import Batch Produk</h1>
                        <p className="text-zinc-400 text-sm md:text-base">Support Upload Gambar (Url / File Local)</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                            onClick={downloadTemplate}
                        >
                            <Download className="mr-2 h-4 w-4" /> Template CSV
                        </Button>
                        <Link href="/admin/products">
                            <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Batal
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* CSV Input */}
                    <div className="md:col-span-2 p-6 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-300">1. Data CSV</label>
                            <span className="text-[10px] text-zinc-500 font-mono">Format: Category, Name, Price, Size, Color, Stock, Image(Optional)</span>
                        </div>

                        {/* CSV File Upload */}
                        <div className="border border-zinc-800 rounded bg-zinc-950 p-2 flex items-center gap-2">
                            <Input
                                type="file"
                                accept=".csv"
                                className="bg-transparent border-0 file:bg-zinc-800 file:text-zinc-300 file:border-0 file:rounded file:px-2 file:py-1 hover:file:bg-zinc-700"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const text = event.target?.result;
                                            if (typeof text === "string") setCsvData(text);
                                        };
                                        reader.readAsText(file);
                                        toast.success("File CSV berhasil dimuat");
                                    }
                                }}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-900 px-2 text-zinc-500">Atau Paste Text Manual</span>
                            </div>
                        </div>

                        <Textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="Kemeja,Kemeja Flanel,125000,M,Merah,10,kemeja-merah.jpg..."
                            className="min-h-[200px] bg-zinc-950 border-zinc-800 font-mono text-xs focus:border-amber-500"
                        />
                    </div>

                    {/* File Upload */}
                    <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4 h-fit">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">2. Upload Gambar (Opsional)</label>
                            <p className="text-xs text-zinc-500">Jika kolom <b>Image</b> di CSV berisi nama file (contoh: <code>baju.jpg</code>), upload file tersebut di sini.</p>
                        </div>

                        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-amber-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setSelectedFiles(e.target.files)}
                            />
                            <Upload className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
                            <p className="text-sm text-zinc-400">
                                {selectedFiles && selectedFiles.length > 0
                                    ? `${selectedFiles.length} file dipilih`
                                    : "Klik / Drag file gambar ke sini"
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                        {uploadProgress ? uploadProgress : "* URL gambar akan otomatis diganti dengan link database setelah upload."}
                    </p>
                    <Button
                        onClick={handleImport}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-10 px-8"
                        disabled={loading || !csvData.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {uploadProgress || "Memproses..."}
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" /> Mulai Import
                            </>
                        )}
                    </Button>
                </div>

                {/* Example Info */}
                <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 text-blue-400 text-xs font-mono">
                    <p>Contoh CSV dengan Gambar:</p>
                    <div className="mt-2 text-zinc-300">
                        Kemeja,Kemeja Premium,100000,M,Hitam,10,<strong>kemeja-hitam.jpg</strong><br />
                        Kemeja,Kemeja Premium,100000,L,Hitam,5,<strong>https://example.com/gambar.jpg</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
