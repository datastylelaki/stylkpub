"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Calendar } from "lucide-react";
import { Transaction } from "@/types/database";

interface DailyReportProps {
    transactions: Transaction[];
}

export function DailyReport({ transactions }: DailyReportProps) {
    // Default to today's date in local format YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toLocaleDateString("en-CA")
    );

    const dailyData = useMemo(() => {
        if (!transactions) return { stats: { total: 0, cash: 0, qris: 0, count: 0, cashCount: 0, qrisCount: 0 }, transactions: [] };

        const filtered = transactions.filter((t) => {
            // Convert transaction UTC string to local date string for comparison
            // This is a simple approximation. For strict accuracy, we might need date-fns or similar
            const txDate = new Date(t.created_at).toLocaleDateString("en-CA");
            return txDate === selectedDate;
        });

        const stats = filtered.reduce(
            (acc, t) => {
                acc.total += t.total;
                acc.count += 1;
                if (t.payment_method === "cash") {
                    acc.cash += t.total;
                    acc.cashCount += 1;
                } else if (t.payment_method === "qris") {
                    acc.qris += t.total;
                    acc.qrisCount += 1;
                }
                return acc;
            },
            { total: 0, cash: 0, qris: 0, count: 0, cashCount: 0, qrisCount: 0 }
        );

        return { stats, transactions: filtered };
    }, [transactions, selectedDate]);

    const handleExport = () => {
        if (dailyData.transactions.length === 0) return;

        const headers = ["ID Transaksi", "Waktu", "Metode Pembayaran", "Total"];
        const rows = dailyData.transactions.map((t) => [
            `#${t.id.substring(0, 8)}`,
            new Date(t.created_at).toLocaleTimeString("id-ID"),
            t.payment_method.toUpperCase(),
            t.total.toString(),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_harian_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight">
                    Laporan Harian
                </h3>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 bg-zinc-900 border-zinc-800 text-white w-[180px]"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleExport}
                        disabled={dailyData.transactions.length === 0}
                        title="Export to CSV"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Per Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Rp {dailyData.stats.total.toLocaleString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dailyData.stats.count} transaksi
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash</CardTitle>
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <span className="text-green-500 font-bold text-xs">CASH</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            Rp {dailyData.stats.cash.toLocaleString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dailyData.stats.cashCount} transaksi
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">QRIS</CardTitle>
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <span className="text-blue-500 font-bold text-xs">QRIS</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            Rp {dailyData.stats.qris.toLocaleString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dailyData.stats.qrisCount} transaksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                    <CardTitle>Daftar Transaksi ({selectedDate})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">ID Transaksi</th>
                                    <th className="px-4 py-3">Metode</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {dailyData.transactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada transaksi pada tanggal ini
                                        </td>
                                    </tr>
                                ) : (
                                    dailyData.transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((t) => (
                                        <tr key={t.id} className="hover:bg-zinc-800/50">
                                            <td className="px-4 py-3">
                                                {new Date(t.created_at).toLocaleTimeString(
                                                    "id-ID",
                                                    { hour: "2-digit", minute: "2-digit" }
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-zinc-400">
                                                #{t.id.substring(0, 8)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-bold ${t.payment_method === "cash"
                                                        ? "bg-green-500/20 text-green-500"
                                                        : "bg-blue-500/20 text-blue-500"
                                                        }`}
                                                >
                                                    {t.payment_method.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                Rp {t.total.toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
