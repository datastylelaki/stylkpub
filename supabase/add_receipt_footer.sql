-- Migration: Add receipt_footer column to store_settings
-- Run this in Supabase SQL Editor

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
