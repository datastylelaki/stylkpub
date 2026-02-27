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
-- qris_image_url sudah ada sebelumnya
