-- 1. Create Helper Function to check Admin role safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop recursive policies
DROP POLICY IF EXISTS "Admin can modify all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can modify categories" ON categories;
DROP POLICY IF EXISTS "Admin can modify products" ON products;
DROP POLICY IF EXISTS "Admin can modify variants" ON product_variants;
DROP POLICY IF EXISTS "Admin can modify settings" ON store_settings;

-- 3. Re-create policies using is_admin()
CREATE POLICY "Admin can modify all profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Admin can modify categories" ON categories FOR ALL USING (is_admin());
CREATE POLICY "Admin can modify products" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admin can modify variants" ON product_variants FOR ALL USING (is_admin());
CREATE POLICY "Admin can modify settings" ON store_settings FOR ALL USING (is_admin());

-- 4. Add DELETE policies for transactions (missing from original schema)
DROP POLICY IF EXISTS "Admin can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can delete transaction items" ON transaction_items;
CREATE POLICY "Admin can delete transactions" ON transactions FOR DELETE USING (is_admin());
CREATE POLICY "Admin can delete transaction items" ON transaction_items FOR DELETE USING (is_admin());
