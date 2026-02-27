// Database types for POS STYLK

export interface Category {
    id: string;
    name: string;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    category_id: string | null;
    base_price: number;
    image_url: string | null;
    created_at: string;
    category?: Category;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    size: string;
    color: string;
    sku: string | null;
    stock: number;
    created_at: string;
    product?: Product;
}

export interface Profile {
    id: string;
    user_id: string;
    name: string;
    role: 'admin' | 'kasir';
    created_at: string;
}

export interface Transaction {
    id: string;
    cashier_id: string | null;
    total: number;
    payment_method: 'cash' | 'qris';
    cash_received: number;
    change_amount: number;
    notes: string | null;
    created_at: string;
    cashier?: Profile;
}

export interface TransactionItem {
    id: string;
    transaction_id: string;
    variant_id: string | null;
    product_name: string;
    variant_info: string | null;
    quantity: number;
    price: number;
    created_at: string;
}

export interface StoreSettings {
    id: string;
    store_name: string;
    store_address: string | null;
    store_phone: string | null;
    qris_image_url: string | null;
    bank_name: string;
    bank_account: string | null;
    bank_holder: string | null;
    receipt_footer: string | null;
    updated_at: string;
}

// Cart types
export interface CartItem {
    variant: ProductVariant & { product: Product };
    quantity: number;
}
