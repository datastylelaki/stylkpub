# Design: Voucher + Marketing Budget + QRIS Image
**Date:** 2026-02-27

## Overview
3 fitur baru: (1) voucher potongan harga di checkout, (2) tracker budget marketing di reports, (3) tampilkan QR image saat QRIS payment.

---

## Fitur 1 — Voucher di Checkout

### Rules
- Muncul saat `grandTotal >= Rp150.000`
- Voucher bisa stack (multiple), max = `Math.floor(grandTotal / 150_000)`
- Jenis voucher: Rp5.000, Rp10.000, Rp15.000, Rp20.000, Rp30.000, Free Kaos (Rp0)
- Kasir klik tombol voucher setelah customer spin wheel
- Voucher yang dipilih tampil sebagai chip (bisa di-remove)
- `netTotal = grandTotal - totalDiscount` (Free Kaos = Rp0)

### Struk
- Setiap voucher = baris terpisah, contoh: `Voucher -Rp10.000`
- Free Kaos = `Free Kaos Rp0`

### DB — Tambah ke `transactions`
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_label TEXT;
-- discount_label: JSON array string, e.g. '["10000","30000","free_kaos"]'
```
- `total` tetap GROSS (tidak dikurangi diskon)
- `discount` = total nilai potongan numerik
- `cash_received` / `change_amount` menggunakan `netTotal`

### Konstanta di CheckoutDialog
```ts
const VOUCHER_MIN = 150_000;
const VOUCHER_OPTIONS = [
  { label: "Rp5.000",  value: 5_000 },
  { label: "Rp10.000", value: 10_000 },
  { label: "Rp15.000", value: 15_000 },
  { label: "Rp20.000", value: 20_000 },
  { label: "Rp30.000", value: 30_000 },
  { label: "Free Kaos", value: 0 },
];
```

---

## Fitur 2 — Marketing Budget di Reports

### DB — Tambah ke `store_settings`
```sql
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS marketing_budget INTEGER DEFAULT 15000000;
```

### Settings page
- Tambah input "Budget Marketing" di `ReceiptSettingsForm` (atau section baru)
- Simpan via `saveStoreSettings` action yang sudah ada

### Reports page
- Card baru "Budget Marketing" di bagian atas metrics
- Budget used = `SUM(transactions.discount)` (Free Kaos = Rp0, tidak ikut)
- Tampilkan: total budget, terpakai, sisa, progress bar

---

## Fitur 3 — QRIS Image

### DB
- Kolom `qris_image_url TEXT` sudah ada di `store_settings` — tidak perlu migrasi

### Settings page
- Tambah input URL "Gambar QRIS" di settings form
- Admin paste URL gambar (upload manual ke hosting/Supabase Storage dulu)

### Panduan Upload untuk Admin
1. Buka Supabase dashboard → Storage → buat bucket `public` (jika belum ada)
2. Upload file QR image
3. Copy public URL
4. Paste di Settings → Gambar QRIS → Save

### CheckoutDialog
- Saat QRIS dipilih, tampilkan `<img src={storeSettings?.qris_image_url}>` di tengah section QRIS
- Fallback: tampil icon QrCode seperti sekarang jika URL kosong

---

## Files yang Diubah
- `src/components/pos/CheckoutDialog.tsx` — voucher UI + logic, QRIS image display
- `src/components/admin/ReceiptSettingsForm.tsx` — input budget marketing + QRIS URL
- `src/app/admin/settings/actions.ts` — saveStoreSettings tambah field baru
- `src/app/reports/page.tsx` — fetch discount sum + marketing budget card
- `src/types/database.ts` — update StoreSettings + Transaction types
- `supabase/add_voucher_budget_qris.sql` — migration SQL

## No Schema Change For
- `transaction_items` — tidak perlu, voucher dicatat di `transactions.discount_label`
- Tidak ada tabel baru
