-- Migration: Add wholesale_discount column to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS wholesale_discount BOOLEAN DEFAULT FALSE;

-- Comment: Jika wholesale_discount = true, pembelian >= 6 pcs diskon Rp5.000/pcs
