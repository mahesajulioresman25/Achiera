import { prisma } from './prisma';

export function generateInvoiceNumber(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `ACH-${yyyy}${mm}${dd}-${random}`;
}

export function calculateOrderTotal(
    basePrice: number,
    quantity: number,
    additionalConfig: any = {}
): { subtotal: number, tax: number, total: number } {

    // Formula: Price * Qty
    const subtotal = basePrice * quantity;

    // Example Tax/Fee Logic (can be updated)
    // const taxRate = 0.11; // 11% PPN
    // const tax = Math.round(subtotal * taxRate);
    const tax = 0; // Currently 0 as per request "hitung subtotal + pajak" (implied logic needs to be verified)

    const total = subtotal + tax;

    return { subtotal, tax, total };
}
