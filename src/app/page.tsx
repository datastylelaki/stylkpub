import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import POSDashboard from "@/components/pos/POSDashboard";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Get products with variants
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .order("name");

  return (
    <POSDashboard
      user={user}
      profile={profile}
      categories={categories || []}
      products={products || []}
    />
  );
}
