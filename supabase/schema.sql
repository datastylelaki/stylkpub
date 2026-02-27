-- =============================================
-- POS STYLK Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('Celana Panjang'),
  ('Celana Pendek'),
  ('Kemeja Panjang'),
  ('Kemeja Pendek'),
  ('Sweater'),
  ('Jaket'),
  ('Hoodie'),
  ('Chinos'),
  ('Baju Muslim');

-- =============================================
-- 2. PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PRODUCT VARIANTS TABLE (Size + Color)
-- =============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  sku TEXT UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size, color)
);

-- =============================================
-- 4. PROFILES TABLE (Kasir & Admin)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')) DEFAULT 'kasir',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
  cash_received INTEGER DEFAULT 0,
  change_amount INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. TRANSACTION ITEMS TABLE
-- =============================================
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_info TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. STORE SETTINGS TABLE
-- =============================================
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT DEFAULT 'STYLK',
  store_address TEXT,
  store_phone TEXT,
  receipt_footer TEXT,
  qris_image_url TEXT,
  bank_name TEXT DEFAULT 'BCA',
  bank_account TEXT,
  bank_holder TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store settings
INSERT INTO store_settings (store_name) VALUES ('STYLK Fashion');

-- =============================================
-- INDEXES for better performance
-- =============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transaction_items_tx ON transaction_items(transaction_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Categories: Everyone can read, only admin can modify
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin can modify categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Products: Everyone can read, only admin can modify
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can modify products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Variants: Everyone can read, only admin can modify  
CREATE POLICY "Anyone can read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admin can modify variants" ON product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Profiles: Users can read all, modify own
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can modify all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Transactions: Authenticated users can read and create
CREATE POLICY "Authenticated can read transactions" ON transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create transactions" ON transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Transaction Items: Authenticated users can read and create
CREATE POLICY "Authenticated can read items" ON transaction_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create items" ON transaction_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Store Settings: Everyone can read, only admin can modify
CREATE POLICY "Anyone can read settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Admin can modify settings" ON store_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to decrease stock after transaction
CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_variants 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-decrease stock
CREATE TRIGGER after_transaction_item_insert
  AFTER INSERT ON transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_stock();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'kasir');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
