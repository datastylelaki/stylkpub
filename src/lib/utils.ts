import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Size surcharge pricing for XXL (+5000) and XXXL (+10000)
export function getSizeSurcharge(size: string): number {
  if (size === "XXL") return 5000;
  if (size === "XXXL") return 10000;
  return 0;
}

export function getVariantPrice(basePrice: number, size: string, sizeSurcharge: boolean): number {
  if (!sizeSurcharge) return basePrice;
  return basePrice + getSizeSurcharge(size);
}

// Wholesale discount: jika enabled dan qty >= 6, diskon Rp5.000/pcs
export const WHOLESALE_MIN_QTY = 6;
export const WHOLESALE_DISCOUNT_AMOUNT = 5000;

export function getWholesaleDiscount(wholesaleEnabled: boolean, quantity: number): number {
  if (wholesaleEnabled && quantity >= WHOLESALE_MIN_QTY) return WHOLESALE_DISCOUNT_AMOUNT;
  return 0;
}
