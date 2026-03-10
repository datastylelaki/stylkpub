-- =============================================
-- HAPUS DATA TRANSAKSI TANGGAL 9 MARET 2026
-- Hanya menghapus transaksi pada 9 Maret (UTC+7 / WIB)
-- Data tanggal 10 Maret TIDAK akan terhapus
-- =============================================

-- 1. Hapus transaction_items yang terkait transaksi tanggal 9 Maret
DELETE FROM transaction_items
WHERE transaction_id IN (
  SELECT id FROM transactions
  WHERE created_at >= '2026-03-08T17:00:00+00:00'  -- 9 Maret 00:00 WIB
    AND created_at < '2026-03-09T17:00:00+00:00'   -- 10 Maret 00:00 WIB
);

-- 2. Hapus transaksi tanggal 9 Maret
DELETE FROM transactions
WHERE created_at >= '2026-03-08T17:00:00+00:00'  -- 9 Maret 00:00 WIB
  AND created_at < '2026-03-09T17:00:00+00:00';  -- 10 Maret 00:00 WIB

-- Verifikasi: cek sisa transaksi
-- SELECT id, total, created_at FROM transactions ORDER BY created_at DESC LIMIT 20;
