import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

const supabase = createClient(url, key);

async function deleteProducts() {
    console.log("Starting deletion process...");
    // Fetch products
    const { data: products, error: pError } = await supabase.from('products').select('id, name');
    if (pError) {
        console.error("Error fetching products:", pError);
        return;
    }

    const keep = products.filter(p => p.name.toLowerCase().includes('arkan') || p.name.toLowerCase().includes('chino') || p.name.toLowerCase().includes('slim'));
    const keepIds = keep.map(p => p.id);
    const deleteIds = products.filter(p => !keepIds.includes(p.id)).map(p => p.id);

    console.log(`Found ${deleteIds.length} products to delete.`);

    if (deleteIds.length > 0) {
        // Try deleting transaction_items first just in case
        console.log("Attempting to delete all transaction_items and transactions to prevent FK constraints...");
        await supabase.from('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log("Deleting product_variants...");
        const { error: vError } = await supabase.from('product_variants').delete().in('product_id', deleteIds);
        if (vError) console.error("Error deleting variants:", vError);

        console.log("Deleting products...");
        const { error: delError } = await supabase.from('products').delete().in('id', deleteIds);
        if (delError) {
            console.error("Error deleting products:", delError);
        } else {
            console.log("Successfully deleted products!");
        }
    } else {
        console.log("No products to delete.");
    }
}

deleteProducts();
