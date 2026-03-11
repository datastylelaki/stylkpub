"use client";

import { useState, useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Trash2, Loader2, Eye } from "lucide-react";
import { Transaction, TransactionItem } from "@/types/database";
import { deleteTransaction } from "@/app/reports/actions";

interface DailyReportProps {
    transactions: Transaction[];
    items?: TransactionItem[];
}

export function DailyReport({ transactions, items = [] }: DailyReportProps) {
    // Default to today's date in local format YYYY-MM-DD
    const today = new Date().toLocaleDateString("en-CA");
    const [startDate, setStartDate] = useState<string>(today);
    const [endDate, setEndDate] = useState<string>(today);
    const [rangeType, setRangeType] = useState("today");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const dailyData = useMemo(() => {
        if (!transactions) return { stats: { total: 0, cash: 0, qris: 0, count: 0, cashCount: 0, qrisCount: 0 }, transactions: [] };

        const filtered = transactions.filter((t) => {
            // Convert transaction UTC string to local date string for comparison
            const txDate = new Date(t.created_at).toLocaleDateString("en-CA");
            // Inclusive date range filtering
            return txDate >= startDate && txDate <= endDate;
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
    }, [transactions, startDate, endDate]);

    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const handleRangeChange = (value: string) => {
        setRangeType(value);
        const todayDate = new Date();

        if (value === "today") {
            const str = formatDate(todayDate);
            setStartDate(str);
            setEndDate(str);
        } else if (value === "yesterday") {
            const yesterday = new Date(todayDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const str = formatDate(yesterday);
            setStartDate(str);
            setEndDate(str);
        } else if (value === "thisMonth") {
            const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
            setStartDate(formatDate(firstDay));
            setEndDate(formatDate(todayDate));
        } else if (value === "last7") {
            const last7 = new Date(todayDate);
            last7.setDate(last7.getDate() - 6);
            setStartDate(formatDate(last7));
            setEndDate(formatDate(todayDate));
        } else if (value === "custom") {
            // Keep current values or reset to today? Keeping current is better UX
        }
    };

    const handleExport = () => {
        if (dailyData.transactions.length === 0) return;

        const headers = ["ID Transaksi", "Waktu", "Metode Pembayaran", "Total"];
        const rows = dailyData.transactions.map((t) => [
            `#${t.id.substring(0, 8)}`,
            new Date(t.created_at).toLocaleString("id-ID"),
            t.payment_method.toUpperCase(),
            t.total.toString(),
        ]);

        const csvContent =
            "\uFEFF" + // BOM for Excel compatibility
            [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan_transaksi_${startDate}_sd_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (transactionId: string) => {
        setDeletingId(transactionId);
        try {
            const result = await deleteTransaction(transactionId);
            if (!result.success) {
                alert(`Gagal hapus: ${result.error}`);
            }
        } catch {
            alert("Terjadi kesalahan saat menghapus transaksi");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight">
                    Laporan Transaksi
                </h3>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select value={rangeType} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Pilih Rentang Waktu" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="yesterday">Kemarin</SelectItem>
                                <SelectItem value="last7">7 Hari Terakhir</SelectItem>
                                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                                <SelectItem value="custom">Pilih Tanggal Manual</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleExport}
                            disabled={dailyData.transactions.length === 0}
                            title="Export to CSV"
                            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>

                    {rangeType === "custom" && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-white w-[140px] h-9 text-xs"
                                />
                            </div>
                            <span className="text-muted-foreground">-</span>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-white w-[140px] h-9 text-xs"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Periode Ini</CardTitle>
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
                    <CardTitle>
                        Daftar Transaksi ({startDate === endDate ? new Date(startDate).toLocaleDateString("id-ID", { dateStyle: 'full' }) : `${new Date(startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} s/d ${new Date(endDate).toLocaleDateString("id-ID", { dateStyle: 'full' })}`})
                    </CardTitle>
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
                                    <th className="px-4 py-3 text-center w-16">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {dailyData.transactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada transaksi pada periode ini
                                        </td>
                                    </tr>
                                ) : (
                                    dailyData.transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((t) => (
                                        <tr key={t.id} className="hover:bg-zinc-800/50">
                                            <td className="px-4 py-3">
                                                {new Date(t.created_at).toLocaleTimeString(
                                                    "id-ID",
                                                    { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }
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
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
                                                                title="Detail Transaksi"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Detail Transaksi #{t.id.substring(0, 8)}</DialogTitle>
                                                                <DialogDescription className="text-zinc-400">
                                                                    {new Date(t.created_at).toLocaleString("id-ID", {
                                                                        dateStyle: "full",
                                                                        timeStyle: "short",
                                                                    })}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="mt-4 space-y-4">
                                                                <div className="rounded-md border border-zinc-800 p-4">
                                                                    <div className="space-y-3">
                                                                        {items.filter(item => item.transaction_id === t.id).map((item) => (
                                                                            <div key={item.id} className="flex justify-between items-start text-sm">
                                                                                <div>
                                                                                    <div className="font-medium text-white">{item.product_name} x {item.quantity}</div>
                                                                                    {item.variant_info && (
                                                                                        <div className="text-xs text-zinc-400 mt-0.5">
                                                                                            {item.variant_info}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="font-medium text-white text-right">
                                                                                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                                                        {t.discount > 0 && (
                                                                            <div className="flex justify-between text-sm mb-2 text-zinc-300">
                                                                                <span>Diskon {t.discount_label ? `(${t.discount_label})` : ""}</span>
                                                                                <span className="text-red-400">-Rp {t.discount.toLocaleString("id-ID")}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between font-bold text-base text-white">
                                                                            <span>Total</span>
                                                                            <span>Rp {t.total.toLocaleString("id-ID")}</span>
                                                                        </div>
                                                                        {t.payment_method === 'cash' && (
                                                                            <>
                                                                                <div className="flex justify-between text-sm mt-3 text-zinc-400">
                                                                                    <span>Tunai</span>
                                                                                    <span>Rp {t.cash_received.toLocaleString("id-ID")}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm mt-1 text-zinc-400">
                                                                                    <span>Kembalian</span>
                                                                                    <span>Rp {t.change_amount.toLocaleString("id-ID")}</span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                                                disabled={deletingId === t.id}
                                                                title="Hapus Transaksi"
                                                            >
                                                                {deletingId === t.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-zinc-400">
                                                                    Transaksi <span className="font-mono font-bold text-white">#{t.id.substring(0, 8)}</span> senilai{" "}
                                                                    <span className="font-bold text-white">Rp {t.total.toLocaleString("id-ID")}</span>{" "}
                                                                    akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                                                                    Batal
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    variant="destructive"
                                                                    onClick={() => handleDelete(t.id)}
                                                                >
                                                                    Hapus
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
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
