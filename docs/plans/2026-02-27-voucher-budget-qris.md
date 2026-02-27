# Voucher + Marketing Budget + QRIS Image Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tambah voucher potongan harga di checkout (stack-able, min Rp150K), tracker budget marketing Rp15M di reports, dan tampilkan QR image saat QRIS payment.

**Architecture:** 6 task independen. DB migration dulu (Task 1), lalu types (Task 2), lalu thermal printer (Task 3), lalu settings (Task 4), lalu checkout (Task 5), lalu reports (Task 6). Tidak ada tabel baru — tambah kolom ke `transactions` dan `store_settings` saja. Voucher disimpan sebagai `discount` (integer) + `discount_label` (JSON string) di `transactions`. Gross `total` tidak berubah.

**Tech Stack:** Next.js 16, React useState, TypeScript, Supabase client, shadcn/ui, ESC/POS thermal printer

---

### Task 1: DB Migration SQL

**Files:**
- Create: `supabase/add_voucher_budget_qris.sql`

**Step 1:** Buat file migration:

```sql
-- Migration: Voucher + Marketing Budget + QRIS Image
-- Run this in Supabase SQL Editor

-- Add voucher discount columns to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_label TEXT;
-- discount: total nominal diskon (Free Kaos = 0)
-- discount_label: JSON array string, e.g. '["Rp10.000","Free Kaos"]'

-- Add marketing budget to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS marketing_budget INTEGER DEFAULT 15000000;
-- qris_image_url sudah ada, tidak perlu migrasi
```

**Step 2:** **Jalankan SQL ini di Supabase SQL Editor** (manual step — tidak bisa otomatis).

**Step 3:** Commit file:
```bash
cd "/Users/vialdjo/STYLK APPS/POS STYLK/.claude/worktrees/serene-tereshkova"
git add supabase/add_voucher_budget_qris.sql
git commit -m "feat(voucher): add DB migration for discount + marketing_budget columns"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

**Step 1:** Tambah field `discount` dan `discount_label` ke interface `Transaction`:

```ts
export interface Transaction {
    id: string;
    cashier_id: string | null;
    total: number;
    payment_method: 'cash' | 'qris';
    cash_received: number;
    change_amount: number;
    discount: number;           // ← tambah
    discount_label: string | null; // ← tambah (JSON array string)
    notes: string | null;
    created_at: string;
    cashier?: Profile;
}
```

**Step 2:** Tambah field `marketing_budget` ke interface `StoreSettings`:

```ts
export interface StoreSettings {
    id: string;
    store_name: string;
    store_address: string | null;
    store_phone: string | null;
    qris_image_url: string | null;
    bank_name: string;
    bank_account: string | null;
    bank_holder: string | null;
    receipt_footer: string | null;
    marketing_budget: number;   // ← tambah
    updated_at: string;
}
```

**Step 3:** Commit:
```bash
git add src/types/database.ts
git commit -m "feat(voucher): update Transaction + StoreSettings types"
```

---

### Task 3: Update ReceiptData Type + Thermal Printer

**Files:**
- Modify: `src/lib/thermal-printer.ts`

**Step 1:** Tambah field `discountItems` ke `ReceiptData` interface (setelah field `items`):

```ts
export interface ReceiptData {
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    receiptFooter?: string;
    items: {
        name: string;
        variantInfo: string;
        quantity: number;
        price: number;
    }[];
    discountItems?: { label: string; amount: number }[]; // ← tambah
    total: number;
    paymentMethod: "cash" | "qris";
    cashReceived?: number;
    changeAmount?: number;
    cashierName: string;
    transactionId: string;
    date: Date;
}
```

**Step 2:** Di fungsi `generateReceipt` (atau yang setara), cari bagian setelah loop items dan sebelum "Total" — tambah printing voucher lines. Cari baris `println(line("-"));` yang ada sebelum `// Total`, ganti dengan:

```ts
    // Discount lines (vouchers)
    if (data.discountItems && data.discountItems.length > 0) {
        for (const d of data.discountItems) {
            const dLabel = d.label;
            const dValue = d.amount === 0 ? "Rp0" : `-${formatCurrency(d.amount)}`;
            println(padRight(dLabel, CHARS_PER_LINE - dValue.length) + dValue);
        }
    }

    println(line("-"));
```

> **Context:** Cari posisi `println(line("-"));` lalu `// Total` dan `cmd(...CMD.BOLD_ON);` — insert kode di atas tepat sebelum `println(line("-"));` yang ada di sana (sekitar baris 293-294 di file saat ini).

**Step 3:** Commit:
```bash
git add src/lib/thermal-printer.ts
git commit -m "feat(voucher): add discountItems to ReceiptData + thermal printer output"
```

---

### Task 4: Update Settings — Marketing Budget + QRIS URL

**Files:**
- Modify: `src/app/admin/settings/actions.ts`
- Modify: `src/components/admin/ReceiptSettingsForm.tsx`

**Step 1:** Di `actions.ts`, update tipe parameter `saveStoreSettings` tambah 2 field baru:

```ts
export async function saveStoreSettings(data: {
    id?: string;
    store_name: string;
    store_address: string | null;
    store_phone: string | null;
    receipt_footer: string | null;
    qris_image_url: string | null;      // ← tambah
    marketing_budget: number;           // ← tambah
}) {
```

**Step 2:** Di blok `update` (jika `data.id`), tambah 2 field ke object update:

```ts
.update({
    store_name: data.store_name,
    store_address: data.store_address,
    store_phone: data.store_phone,
    receipt_footer: data.receipt_footer,
    qris_image_url: data.qris_image_url,     // ← tambah
    marketing_budget: data.marketing_budget, // ← tambah
    updated_at: new Date().toISOString(),
})
```

**Step 3:** Di blok `insert` (jika tidak ada `data.id`), tambah 2 field ke object insert:

```ts
.insert({
    store_name: data.store_name,
    store_address: data.store_address,
    store_phone: data.store_phone,
    receipt_footer: data.receipt_footer,
    qris_image_url: data.qris_image_url,     // ← tambah
    marketing_budget: data.marketing_budget, // ← tambah
    bank_name: "",
})
```

**Step 4:** Di `ReceiptSettingsForm.tsx`, tambah 2 state baru setelah state `receiptFooter`:

```ts
const [qrisImageUrl, setQrisImageUrl] = useState(settings?.qris_image_url || "");
const [marketingBudget, setMarketingBudget] = useState(settings?.marketing_budget ?? 15_000_000);
```

**Step 5:** Update call `saveStoreSettings` di `handleSave` — tambah 2 field baru:

```ts
await saveStoreSettings({
    id: settings?.id,
    store_name: storeName,
    store_address: storeAddress || null,
    store_phone: storePhone || null,
    receipt_footer: receiptFooter || null,
    qris_image_url: qrisImageUrl || null,        // ← tambah
    marketing_budget: marketingBudget,           // ← tambah
});
```

**Step 6:** Di JSX `ReceiptSettingsForm`, di dalam Card "Pengaturan Struk" (sebelum Receipt Preview), tambah 2 input baru:

```tsx
{/* QRIS Image URL */}
<div className="space-y-2">
    <Label htmlFor="qrisImageUrl">URL Gambar QRIS</Label>
    <Input
        id="qrisImageUrl"
        value={qrisImageUrl}
        onChange={(e) => setQrisImageUrl(e.target.value)}
        placeholder="https://... (URL gambar QR code)"
        className="bg-muted/50 border-input"
    />
    <p className="text-xs text-muted-foreground">
        Upload gambar ke Supabase Storage atau hosting lain, lalu paste URL-nya di sini.
    </p>
</div>

{/* Marketing Budget */}
<div className="space-y-2">
    <Label htmlFor="marketingBudget">Budget Marketing (Rp)</Label>
    <Input
        id="marketingBudget"
        type="number"
        value={marketingBudget}
        onChange={(e) => setMarketingBudget(Number(e.target.value))}
        placeholder="15000000"
        className="bg-muted/50 border-input"
    />
    <p className="text-xs text-muted-foreground">
        Budget total untuk voucher. Default Rp15.000.000.
    </p>
</div>
```

**Step 7:** Commit:
```bash
git add src/app/admin/settings/actions.ts src/components/admin/ReceiptSettingsForm.tsx
git commit -m "feat(voucher): add QRIS URL + marketing budget to settings"
```

---

### Task 5: Voucher + QRIS Image di CheckoutDialog

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Context:** File ini sudah punya `TEBUS_HARGA`, `TEBUS_MIN`, `tebusQty`, `grandTotal`. Kita tambah voucher di atasnya.

**Step 1:** Tambah konstanta voucher di bawah konstanta `TEBUS_MIN` (module level):

```ts
const VOUCHER_MIN = 150_000;
const VOUCHER_OPTIONS = [
    { label: "Rp5.000",  value: 5_000 },
    { label: "Rp10.000", value: 10_000 },
    { label: "Rp15.000", value: 15_000 },
    { label: "Rp20.000", value: 20_000 },
    { label: "Rp30.000", value: 30_000 },
    { label: "Free Kaos", value: 0 },
] as const;
type VoucherOption = typeof VOUCHER_OPTIONS[number];
```

**Step 2:** Tambah state `appliedVouchers` di dalam komponen, setelah `tebusQty`:

```ts
const [appliedVouchers, setAppliedVouchers] = useState<VoucherOption[]>([]);
```

**Step 3:** Tambah derived values `totalDiscount` dan `netTotal` setelah `grandTotal`:

```ts
const totalDiscount = appliedVouchers.reduce((sum, v) => sum + v.value, 0);
const netTotal = grandTotal - totalDiscount;
const maxVouchers = Math.floor(grandTotal / VOUCHER_MIN);
```

**Step 4:** Update `changeAmount` dan `canProceed` agar pakai `netTotal`:

```ts
const changeAmount = paymentMethod === "cash"
    ? Math.max(0, Number(cashReceived) - netTotal)
    : 0;

const canProceed = paymentMethod === "cash"
    ? Number(cashReceived) >= netTotal
    : true;
```

**Step 5:** Tambah reset `appliedVouchers` di `handleClose` (dalam blok `if (success)`):

```ts
setAppliedVouchers([]);
```

**Step 6:** Tambah helper `addVoucher` dan `removeVoucher` di dalam komponen (setelah `handleClose`):

```ts
function addVoucher(option: VoucherOption) {
    if (appliedVouchers.length >= maxVouchers) return;
    setAppliedVouchers(prev => [...prev, option]);
}

function removeVoucher(index: number) {
    setAppliedVouchers(prev => prev.filter((_, i) => i !== index));
}
```

**Step 7:** Update `handleCheckout` — ubah insert transaction agar pakai `netTotal` dan simpan discount:

```ts
// Ganti baris total: grandTotal → netTotal, dan cash_received: grandTotal → netTotal
// Tambah discount dan discount_label
const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
        cashier_id: profile.id,
        total: grandTotal,     // tetap gross
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? Number(cashReceived) : netTotal,
        change_amount: changeAmount,
        discount: totalDiscount,
        discount_label: appliedVouchers.length > 0
            ? JSON.stringify(appliedVouchers.map(v => v.label))
            : null,
    })
    .select()
    .single();
```

**Step 8:** Update `handlePrint` — ganti `total: grandTotal` dengan `total: netTotal` dan tambah `discountItems`:

```ts
const receiptData: ReceiptData = {
    // ... semua field yang sudah ada ...
    discountItems: appliedVouchers.length > 0
        ? appliedVouchers.map(v => ({ label: `Voucher ${v.label}`, amount: v.value }))
        : undefined,
    total: netTotal,   // ← ubah dari grandTotal
    // ... sisa field tidak berubah
};
```

**Step 9:** Update display di `handlePrint` - `cashReceived` pakai `netTotal` untuk QRIS:
```ts
cashReceived: paymentMethod === "cash" ? Number(cashReceived) : undefined,
```
(ini sudah benar, tidak perlu ubah)

**Step 10:** Update success screen — ganti `{formatRupiah(grandTotal)}` dengan `{formatRupiah(netTotal)}`.

**Step 11:** Update "Uang Pas" button — ganti `grandTotal.toString()` dengan `netTotal.toString()`.

**Step 12:** Update kembalian check — ganti `Number(cashReceived) >= grandTotal` dengan `Number(cashReceived) >= netTotal`.

**Step 13:** Update display "Total Pembayaran" — ganti `{formatRupiah(grandTotal)}` dengan `{formatRupiah(netTotal)}`. (Note: bisa tambahkan sub-line "Diskon: -RpXXX" jika ada diskon)

**Step 14:** Di JSX bagian `!success`, tambah section Voucher SEBELUM section "Cash Input". Letakkan setelah closing `</div>` section Tebus Murah:

```tsx
{/* Voucher */}
{grandTotal >= VOUCHER_MIN && (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-300">Voucher</span>
            </div>
            <span className="text-xs text-zinc-400">
                {appliedVouchers.length}/{maxVouchers} voucher dipakai
            </span>
        </div>

        {/* Applied vouchers chips */}
        {appliedVouchers.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {appliedVouchers.map((v, i) => (
                    <button
                        key={i}
                        onClick={() => removeVoucher(i)}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                        {v.label} ✕
                    </button>
                ))}
            </div>
        )}

        {/* Voucher buttons */}
        {appliedVouchers.length < maxVouchers && (
            <div className="flex flex-wrap gap-2">
                {VOUCHER_OPTIONS.map((opt) => (
                    <Button
                        key={opt.label}
                        variant="outline"
                        size="sm"
                        onClick={() => addVoucher(opt)}
                        className="border-purple-500/40 bg-zinc-800 text-purple-300 hover:bg-purple-500/20 text-xs"
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
        )}

        {totalDiscount > 0 && (
            <div className="text-right text-purple-300 font-semibold text-sm">
                Diskon: -{formatRupiah(totalDiscount)}
            </div>
        )}
    </div>
)}
```

**Step 15:** Tambah import `Gift` dari lucide-react di baris import icons.

**Step 16:** Di section QRIS payment, tambah tampilan QR image jika `storeSettings?.qris_image_url` ada. Ganti section QRIS yang ada:

```tsx
{paymentMethod === "qris" && (
    <div className="bg-zinc-800 p-6 rounded-lg text-center space-y-3">
        {storeSettings?.qris_image_url ? (
            <img
                src={storeSettings.qris_image_url}
                alt="QRIS Payment"
                className="mx-auto w-48 h-48 object-contain rounded"
            />
        ) : (
            <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                <QrCode className="w-8 h-8 text-amber-500" />
            </div>
        )}
        <div>
            <p className="font-medium text-white mb-1">Pembayaran QRIS</p>
            <p className="text-sm text-zinc-400">Silakan scan QRIS di kasir.</p>
            <p className="text-sm text-zinc-400">Klik "Konfirmasi" setelah pembayaran berhasil.</p>
        </div>
    </div>
)}
```

**Step 17:** Commit:
```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(voucher): add voucher UI, QRIS image display to checkout"
```

---

### Task 6: Marketing Budget Card di Reports Page

**Files:**
- Modify: `src/app/reports/page.tsx`

**Step 1:** Di `ReportsPage`, tambah query untuk total discount dan marketing budget. Setelah query `transactions` dan `items`, tambah:

```ts
// Total discount dari semua voucher yang terpakai
const totalVoucherUsed = transactions?.reduce((sum, t) => sum + (t.discount || 0), 0) || 0;

// Marketing budget dari store_settings
const { data: storeSettings } = await supabase
    .from("store_settings")
    .select("marketing_budget")
    .maybeSingle();

const marketingBudget = storeSettings?.marketing_budget ?? 15_000_000;
const marketingBudgetRemaining = marketingBudget - totalVoucherUsed;
const marketingBudgetPercent = marketingBudget > 0
    ? Math.min(100, Math.round((totalVoucherUsed / marketingBudget) * 100))
    : 0;
```

**Step 2:** Di JSX, tambah Card baru "Budget Marketing" di dalam grid metrics (grid yang sudah ada `md:grid-cols-2 lg:grid-cols-4`). Tambah sebagai card kelima setelah card "Produk Aktif":

```tsx
<Card className="bg-zinc-900 border-zinc-800 text-white col-span-full md:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Budget Marketing Voucher</CardTitle>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
            strokeWidth="2" className="h-4 w-4 text-muted-foreground">
            <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
    </CardHeader>
    <CardContent className="space-y-3">
        <div className="flex justify-between items-end">
            <div>
                <div className="text-2xl font-bold text-purple-400">
                    Rp {totalVoucherUsed.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground">terpakai dari budget voucher</p>
            </div>
            <div className="text-right">
                <div className="text-sm font-medium text-zinc-300">
                    Sisa: Rp {Math.max(0, marketingBudgetRemaining).toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground">
                    Budget: Rp {marketingBudget.toLocaleString("id-ID")}
                </p>
            </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-zinc-700 rounded-full h-2">
            <div
                className={`h-2 rounded-full transition-all ${
                    marketingBudgetPercent >= 90 ? "bg-red-500" :
                    marketingBudgetPercent >= 70 ? "bg-amber-500" : "bg-purple-500"
                }`}
                style={{ width: `${marketingBudgetPercent}%` }}
            />
        </div>
        <p className="text-xs text-muted-foreground">{marketingBudgetPercent}% terpakai</p>
    </CardContent>
</Card>
```

**Step 3:** Commit & push ke main:

```bash
git add src/app/reports/page.tsx
git commit -m "feat(voucher): add marketing budget card to reports page"

# Merge ke main
cd "/Users/vialdjo/STYLK APPS/POS STYLK"
git merge claude/serene-tereshkova
git push origin main
```

---

### Panduan Upload QRIS Image (untuk Admin)

Setelah deploy, untuk menampilkan QR image di checkout QRIS:

**Via Supabase Storage:**
1. Buka [supabase.com](https://supabase.com) → project → **Storage**
2. Buat bucket baru bernama `public` (set ke Public)
3. Upload file gambar QR code (PNG/JPG)
4. Klik gambar → **Get URL** → copy URL-nya
5. Buka app → **Settings** → paste URL di field "URL Gambar QRIS" → Save

**Alternatif (lebih cepat):** Upload ke [imgbb.com](https://imgbb.com) atau [postimages.org](https://postimages.org), copy direct link, paste ke Settings.

---

### Cara Test Manual

1. **Voucher:** Tambah item >= Rp150K → checkout → section Voucher muncul → klik tombol voucher → total berkurang → checkout → cek Supabase `transactions.discount`
2. **Stack voucher:** Total >= Rp300K → bisa pakai 2 voucher
3. **QRIS image:** Isi URL gambar di Settings → checkout QRIS → gambar muncul
4. **Budget reports:** Buka `/reports` → card "Budget Marketing Voucher" muncul dengan progress bar
5. **Settings save:** Ubah budget + QRIS URL → Save → refresh → nilai tersimpan
