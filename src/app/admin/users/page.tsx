import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield, ShieldCheck } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserRoleToggle } from "@/components/admin/UserRoleToggle";
import { ModeToggle } from "@/components/mode-toggle";

export default async function AdminUsersPage() {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } = { user: null } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check role using regular client for safety
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return <div className="p-8 text-center text-white">Akses Ditolak: Anda bukan Admin.</div>;
    }

    // Fetch all users from profiles using admin client
    const { data: profiles } = await adminSupabase
        .from("profiles")
        .select("*")
        .order("name");

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Manajemen User</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Atur hak akses staf toko Anda.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products" className="w-full md:w-auto">
                        <Button variant="outline" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Produk
                        </Button>
                    </Link>
                    <Link href="/admin/settings" className="w-full md:w-auto">
                        <Button variant="outline" className="text-muted-foreground hover:text-foreground w-full">
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                            <TableHead className="text-muted-foreground">Nama User</TableHead>
                            <TableHead className="text-muted-foreground w-[100px]">Role</TableHead>
                            <TableHead className="text-right text-muted-foreground">Hak Akses (Admin)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((p: any) => (
                            <TableRow key={p.id} className="border-border hover:bg-muted/50">
                                <TableCell className="font-medium flex items-center gap-2 text-amber-500">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {p.name}
                                </TableCell>
                                <TableCell>
                                    {p.role === "admin" ? (
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase">Admin</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase">Kasir</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <UserRoleToggle
                                        userId={p.user_id}
                                        initialRole={p.role}
                                        isCurrentUser={p.user_id === user.id}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {profiles?.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-lg border border-border bg-card space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-500">{p.name}</p>
                                    <div className="mt-0.5">
                                        {p.role === "admin" ? (
                                            <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase">
                                                <ShieldCheck className="h-3 w-3" /> Admin
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold uppercase">
                                                <Shield className="h-3 w-3" /> Kasir
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-border flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Akses Admin</span>
                            <UserRoleToggle
                                userId={p.user_id}
                                initialRole={p.role}
                                isCurrentUser={p.user_id === user.id}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
