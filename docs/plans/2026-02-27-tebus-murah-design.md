# Design: Fitur Tebus Murah
**Date:** 2026-02-27

## Overview
Opsi tambahan saat checkout — pelanggan bisa membeli item "Tebus Murah" seharga Rp25.000/pcs jika total belanja minimal Rp200.000.

## Keputusan
- **Approach:** State lokal di `CheckoutDialog` (Opsi A)
- **Stok:** Tidak di-track (tanpa batas)
- **Batas qty:** Bebas, tidak ada batas per transaksi
- **Struk:** Masuk sebagai baris item di struk thermal
- **WhatsApp:** Fitur WhatsApp dihapus dari CheckoutDialog

## UI & Flow
Section "Tebus Murah" muncul di CheckoutDialog jika `total >= Rp200.000`, setelah section metode pembayaran. Berisi tombol `−` dan `+` untuk atur qty. Jika total turun < 200.000, section hilang dan qty reset ke 0.

## Konstanta
```ts
const TEBUS_HARGA = 25_000;
const TEBUS_MIN = 200_000;
```

## Kalkulasi
```ts
grandTotal = total + (tebusQty * TEBUS_HARGA)
```
Semua kalkulasi (kembalian, canProceed, display, DB insert) pakai `grandTotal`.

## Database
Saat `tebusQty > 0`, insert 1 baris tambahan ke `transaction_items`:
```ts
{
  transaction_id: transaction.id,
  variant_id: null,
  product_name: "Tebus Murah",
  variant_info: null,
  quantity: tebusQty,
  price: 25000,
}
```
Tidak ada perubahan schema database.

## File yang Diubah
- `src/components/pos/CheckoutDialog.tsx` — tambah tebus murah state & UI, hapus WhatsApp button
