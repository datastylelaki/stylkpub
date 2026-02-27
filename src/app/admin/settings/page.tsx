import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReceiptSettingsForm } from "@/components/admin/ReceiptSettingsForm";

export default async function AdminSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return <div className="p-8 text-center">Akses Ditolak: Anda bukan Admin.</div>;
    }

    const { data: settings } = await supabase
        .from("store_settings")
        .select("*")
        .single();

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Toko</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Atur informasi toko dan struk.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Produk
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline">POS</Button>
                    </Link>
                </div>
            </div>

            <ReceiptSettingsForm settings={settings} />
        </div>
    );
}
