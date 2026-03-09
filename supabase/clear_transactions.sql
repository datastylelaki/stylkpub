-- =============================================
-- HAPUS SEMUA DATA TRANSAKSI (Dashboard & Laporan)
-- Hanya menghapus: transaction_items & transactions
-- TIDAK menghapus: products, categories, profiles, store_settings
-- =============================================

-- 1. Hapus semua item transaksi dulu (karena ada relasi foreign key)
DELETE FROM transaction_items;

-- 2. Hapus semua transaksi
DELETE FROM transactions;

-- Verifikasi (opsional)
-- SELECT COUNT(*) FROM transactions;
-- SELECT COUNT(*) FROM transaction_items;
