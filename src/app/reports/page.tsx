import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalesChart } from "@/components/reports/SalesChart";
import { TopProducts } from "@/components/reports/TopProducts";
import { DailyReport } from "@/components/reports/DailyReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return <div className="p-8 text-center text-white">Akses Ditolak: Khusus Admin.</div>;
    }

    // Fetch transactions
    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: true });

    // Fetch transaction items for top products
    const { data: items } = await supabase
        .from("transaction_items")
        .select("*");

    // Calculate Metrics
    const totalRevenue = transactions?.reduce((sum, t) => sum + t.total, 0) || 0;
    const totalTransactions = transactions?.length || 0;
    const averageBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate Payment Method Stats
    const cashTransactionsList = transactions?.filter(t => t.payment_method === 'cash') || [];
    const qrisTransactionsList = transactions?.filter(t => t.payment_method === 'qris') || [];

    const cashRevenue = cashTransactionsList.reduce((sum, t) => sum + t.total, 0);
    const qrisRevenue = qrisTransactionsList.reduce((sum, t) => sum + t.total, 0);

    const cashTransactions = cashTransactionsList.length;
    const qrisTransactions = qrisTransactionsList.length;

    // Calculate Daily Sales for Chart
    const salesByDate = (transactions || []).reduce((acc: any, t) => {
        const date = new Date(t.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
        acc[date] = (acc[date] || 0) + t.total;
        return acc;
    }, {});

    const chartData = Object.keys(salesByDate).map(date => ({
        name: date,
        total: salesByDate[date],
    }));

    // Calculate Top Products
    const productStats = (items || []).reduce((acc: any, item) => {
        const name = item.product_name;
        if (!acc[name]) {
            acc[name] = { name, sales: 0, revenue: 0 };
        }
        acc[name].sales += item.quantity;
        acc[name].revenue += item.price * item.quantity;
        return acc;
    }, {});

    const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 5) as any[];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 min-h-screen bg-black text-white">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard & Laporan</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/">
                        <Button variant="outline" className="text-white hover:text-white bg-transparent border-zinc-700 hover:bg-zinc-800">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke POS
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString("id-ID")}</div>
                        <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTransactions}</div>
                        <p className="text-xs text-muted-foreground">+180.1% dari bulan lalu</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Penerimaan</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {Math.round(averageBasket).toLocaleString("id-ID")}</div>
                        <p className="text-xs text-muted-foreground">+19% dari bulan lalu</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground">+201 sejak jam terakhir</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Method Breakdown */}
            <h3 className="text-xl font-bold tracking-tight mt-8 mb-4">Metode Pembayaran</h3>
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pembayaran Cash</CardTitle>
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <span className="text-green-500 font-bold text-xs">CASH</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Rp {cashRevenue.toLocaleString("id-ID")}</div>
                        <p className="text-xs text-muted-foreground">{cashTransactions} transaksi</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pembayaran QRIS</CardTitle>
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <span className="text-blue-500 font-bold text-xs">QRIS</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">Rp {qrisRevenue.toLocaleString("id-ID")}</div>
                        <p className="text-xs text-muted-foreground">{qrisTransactions} transaksi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Report Section */}
            <DailyReport transactions={transactions || []} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle>Overview Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <SalesChart data={chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle>Produk Terlaris</CardTitle>
                        <CardDescription>
                            Produk dengan penjualan terbanyak bulan ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopProducts products={topProducts} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
