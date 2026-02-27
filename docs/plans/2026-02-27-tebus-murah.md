# Tebus Murah Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tambah opsi "Tebus Murah" Rp25.000/pcs di checkout saat total belanja >= Rp200.000, dengan qty plus-minus bebas, tercatat di struk dan laporan.

**Architecture:** Semua perubahan di satu file (`CheckoutDialog.tsx`). State `tebusQty` lokal di komponen. `grandTotal` menggantikan `total` prop untuk semua kalkulasi. Tebus murah diinsert sebagai baris `transaction_items` saat checkout. Tidak ada perubahan database.

**Tech Stack:** React (useState), TypeScript, shadcn/ui (Button, Label, Separator), Supabase client

---

### Task 1: Tambah konstanta & state `tebusQty`

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Step 1:** Tambah dua konstanta di atas definisi komponen (setelah `type PaymentMethod`):

```ts
const TEBUS_HARGA = 25_000;
const TEBUS_MIN = 200_000;
```

**Step 2:** Tambah state `tebusQty` di dalam komponen, setelah baris `const [storeSettings, ...]`:

```ts
const [tebusQty, setTebusQty] = useState(0);
```

**Step 3:** Tambah derived value `grandTotal` setelah baris `const changeAmount`:

```ts
const grandTotal = total + tebusQty * TEBUS_HARGA;
```

**Step 4:** Reset `tebusQty` di `handleClose` — di dalam blok `if (success)`, tambah:

```ts
setTebusQty(0);
```

**Step 5:** Tambah efek reset qty kalau total turun di bawah minimum — setelah `useEffect` yang ada:

```ts
useEffect(() => {
    if (total < TEBUS_MIN) setTebusQty(0);
}, [total]);
```

**Step 6:** Commit

```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(tebus-murah): add tebusQty state and grandTotal"
```

---

### Task 2: Ganti semua referensi `total` dengan `grandTotal` di UI & logic

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Step 1:** Ganti `changeAmount` — ubah dari:
```ts
const changeAmount = paymentMethod === "cash"
    ? Math.max(0, Number(cashReceived) - total)
    : 0;
```
Menjadi:
```ts
const changeAmount = paymentMethod === "cash"
    ? Math.max(0, Number(cashReceived) - grandTotal)
    : 0;
```

**Step 2:** Ganti `canProceed` — ubah dari:
```ts
const canProceed = paymentMethod === "cash"
    ? Number(cashReceived) >= total
    : true;
```
Menjadi:
```ts
const canProceed = paymentMethod === "cash"
    ? Number(cashReceived) >= grandTotal
    : true;
```

**Step 3:** Di display "Total Pembayaran" di JSX, ganti `{formatRupiah(total)}` menjadi `{formatRupiah(grandTotal)}`.

**Step 4:** Di success screen, ganti `{formatRupiah(total)}` menjadi `{formatRupiah(grandTotal)}`.

**Step 5:** Di `quickCashAmounts` — tambah `grandTotal` sebagai salah satu quick amount. Ubah tombol "Uang Pas":
```ts
onClick={() => setCashReceived(grandTotal.toString())}
```

**Step 6:** Commit

```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(tebus-murah): replace total with grandTotal in UI and logic"
```

---

### Task 3: Update `handleCheckout` untuk pakai `grandTotal` dan insert tebus murah

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Step 1:** Di `handleCheckout`, ganti insert transaction — ubah `total` menjadi `grandTotal`:

```ts
const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
        cashier_id: profile.id,
        total: grandTotal,           // ← ubah dari total
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? Number(cashReceived) : grandTotal, // ← ubah dari total
        change_amount: changeAmount,
    })
    .select()
    .single();
```

**Step 2:** Setelah insert `transaction_items` cart biasa, tambah insert tebus murah (sebelum `if (itemsError) throw itemsError`):

```ts
// Insert transaction items
const items = cart.map((item) => ({
    transaction_id: transaction.id,
    variant_id: item.variant.id,
    product_name: item.variant.product.name,
    variant_info: `${item.variant.size} / ${item.variant.color}`,
    quantity: item.quantity,
    price: item.variant.product.base_price,
}));

// Tambah tebus murah jika ada
if (tebusQty > 0) {
    items.push({
        transaction_id: transaction.id,
        variant_id: null,
        product_name: "Tebus Murah",
        variant_info: null,
        quantity: tebusQty,
        price: TEBUS_HARGA,
    });
}

const { error: itemsError } = await supabase
    .from("transaction_items")
    .insert(items);
```

**Step 3:** Di fungsi `handlePrint`, update `receiptData` agar include tebus murah di items:

```ts
items: [
    ...cart.map((item) => ({
        name: item.variant.product.name,
        variantInfo: `${item.variant.size} / ${item.variant.color}`,
        quantity: item.quantity,
        price: item.variant.product.base_price,
    })),
    ...(tebusQty > 0 ? [{
        name: "Tebus Murah",
        variantInfo: null,
        quantity: tebusQty,
        price: TEBUS_HARGA,
    }] : []),
],
total: grandTotal,                                              // ← ubah dari total
cashReceived: paymentMethod === "cash" ? Number(cashReceived) : undefined,
changeAmount: paymentMethod === "cash" ? changeAmount : undefined,
```

**Step 4:** Commit

```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(tebus-murah): insert tebus murah to transaction and receipt"
```

---

### Task 4: Tambah UI section Tebus Murah di JSX

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Step 1:** Tambah import `Tag` dari lucide-react di baris import icons:
```ts
import { Banknote, QrCode, Loader2, CheckCircle2, Printer, Tag } from "lucide-react";
```

**Step 2:** Di JSX (bagian `!success`), tambah section Tebus Murah setelah section payment method (setelah closing `</div>` dari grid metode pembayaran), sebelum section Cash Input:

```tsx
{/* Tebus Murah */}
{total >= TEBUS_MIN && (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-amber-400">Tebus Murah</span>
            </div>
            <span className="text-sm text-zinc-400">{formatRupiah(TEBUS_HARGA)}/pcs</span>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-zinc-600 bg-zinc-800"
                    onClick={() => setTebusQty(q => Math.max(0, q - 1))}
                    disabled={tebusQty === 0}
                >
                    −
                </Button>
                <span className="w-6 text-center font-bold text-lg">{tebusQty}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-zinc-600 bg-zinc-800"
                    onClick={() => setTebusQty(q => q + 1)}
                >
                    +
                </Button>
            </div>
            {tebusQty > 0 && (
                <span className="text-amber-400 font-semibold">
                    {formatRupiah(tebusQty * TEBUS_HARGA)}
                </span>
            )}
        </div>
    </div>
)}
```

**Step 3:** Commit

```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(tebus-murah): add Tebus Murah UI section in checkout"
```

---

### Task 5: Hapus tombol WhatsApp

**Files:**
- Modify: `src/components/pos/CheckoutDialog.tsx`

**Step 1:** Hapus import `MessageCircle` dari lucide-react.

**Step 2:** Hapus seluruh fungsi `handleWhatsApp` (baris ~208–225).

**Step 3:** Hapus tombol WhatsApp dari JSX success screen (blok `<Button ... onClick={handleWhatsApp}>`).

**Step 4:** Commit & push ke main

```bash
git add src/components/pos/CheckoutDialog.tsx
git commit -m "feat(tebus-murah): remove WhatsApp button from checkout"
git push origin main
```

---

### Cara Test Manual

1. Buka POS, tambah item hingga total >= Rp200.000
2. Klik Checkout — pastikan section "Tebus Murah" muncul
3. Klik `+` beberapa kali, pastikan total bertambah Rp25.000/klik
4. Kurangi item cart hingga < Rp200.000 — section hilang, qty reset
5. Kembali >= 200.000, checkout — cek struk thermal include "Tebus Murah"
6. Cek Supabase `transaction_items` — ada baris dengan `product_name = 'Tebus Murah'`
