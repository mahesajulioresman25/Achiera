'use server';

import { smartMatchProduct } from "@/lib/intelligence/automationEngine";
import { visionService } from "@/lib/services/VisionService";

export interface ParsedOrderItem {
    productId: string;
    variantId: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export async function parseOrderFromTextAction(brandId: string, text: string) {
    try {
        const lines = text.split('\n').filter(line => line.trim());
        const items: ParsedOrderItem[] = [];

        for (const line of lines) {
            // Pattern 1: "[Qty]x [Product Name]"
            // Pattern 2: "[Product Name] x[Qty]"
            // Pattern 3: "[Product Name] [Qty]"

            let namePart = '';
            let qtyPart = 1;

            const match1 = line.match(/^(\d+)\s*x\s*(.*)$/i);
            const match2 = line.match(/^(.*)\s*x\s*(\d+)$/i);
            const match3 = line.match(/^(.*?)\s+(\d+)$/);

            if (match1) {
                qtyPart = parseInt(match1[1]);
                namePart = match1[2].trim();
            } else if (match2) {
                namePart = match2[1].trim();
                qtyPart = parseInt(match2[2]);
            } else if (match3) {
                namePart = match3[1].trim();
                qtyPart = parseInt(match3[2]);
            } else {
                namePart = line.trim();
            }

            const match = await smartMatchProduct(brandId, namePart, 'MANUAL_SCAN');
            if (match.success && match.variant) {
                items.push({
                    productId: match.variant.productId,
                    variantId: match.variant.id,
                    name: match.variant.product.name,
                    quantity: qtyPart,
                    price: Number(match.variant.price),
                    subtotal: Number(match.variant.price) * qtyPart
                });
            }
        }

        return { success: true, data: items };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function processOrderScreenshotAction(brandId: string, base64Image: string) {
    try {
        const visionResult = await visionService.extractOrderFromImage(base64Image);
        if (!visionResult) throw new Error("Gagal mengekstrak data dari gambar.");

        const items: ParsedOrderItem[] = [];
        for (const item of visionResult.items) {
            const match = await smartMatchProduct(brandId, item.name, 'VISION');
            if (match.success && match.variant) {
                items.push({
                    productId: match.variant.productId,
                    variantId: match.variant.id,
                    name: match.variant.product.name,
                    quantity: item.quantity || 1,
                    price: Number(match.variant.price),
                    subtotal: Number(match.variant.price) * (item.quantity || 1)
                });
            }
        }

        return {
            success: true,
            data: {
                orderId: visionResult.orderId,
                customerName: visionResult.customerName,
                items,
                totalAmount: visionResult.totalAmount
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
