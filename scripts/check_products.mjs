import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Simple env loader since dotenv might not be available
const envStr = fs.readFileSync(".env.local", "utf-8");
const env = {};
envStr.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
        env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
});

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const key = env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!url || !key) {
    console.error("Missing SUPABASE credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkProducts() {
    const { data: products, error } = await supabase.from('products').select('id, name');
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }
    console.log("Total Products:", products.length);
    console.log("--- Products to keep ---");
    const keep = products.filter(p => p.name.toLowerCase().includes('arkan') || p.name.toLowerCase().includes('chino') || p.name.toLowerCase().includes('slim'));
    keep.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));
    console.log("------------------------");
}

checkProducts();
