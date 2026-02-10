import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreSettings } from "./actions";
import SettingsForm from "./SettingsForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

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
        return <div className="p-8 text-center text-white">Akses Ditolak.</div>;
    }

    const settings = await getStoreSettings();

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Settings className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Toko</h1>
                            <p className="text-muted-foreground text-sm md:text-base">Kelola identitas toko dan akun pembayaran.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/products">
                            <Button variant="outline" className="border-border hover:bg-muted">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Admin
                            </Button>
                        </Link>
                    </div>
                </div>

                <SettingsForm initialData={settings} />
            </div>
        </div>
    );
}
