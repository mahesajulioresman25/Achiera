'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { JournalService } from './journalService';

export interface AutomatedOrderData {
    brandId: string;
    platform: string;
    externalOrderId: string;
    customerName: string;
    customerPhone?: string;
    items: {
        externalName: string;
        quantity: number;
        price: number;
    }[];
    grandTotal: number;
}

/**
 * AAE Smart Matcher: Finds existing mapping or suggests the closest variant.
 */
export async function smartMatchProduct(brandId: string, externalName: string, platform: string) {
    // 1. Check existing robust mapping
    const mapping = await prisma.productMapping.findUnique({
        where: {
            brandId_externalName_platform: {
                brandId,
                externalName,
                platform
            }
        },
        include: { variant: true }
    });

    if (mapping && mapping.automationActive) {
        return { success: true, variant: mapping.variant, isExactMapping: true };
    }

    // 2. Fuzzy match attempt (Lowercase & simple similarity)
    // In a real app we'd use a similarity library, here we use simple string containment
    const variants = await prisma.frozenVariant.findMany({
        where: { product: { category: { brandId } } },
        include: { product: true }
    });

    const target = externalName.toLowerCase();
    const matches = variants.map(v => {
        const name = `${v.product.name} ${v.name}`.toLowerCase();
        let score = 0;
        if (name === target) score = 100;
        else if (name.includes(target) || target.includes(name)) score = 80;

        return { variant: v, score };
    }).sort((a, b) => b.score - a.score);

    if (matches.length > 0 && matches[0].score >= 80) {
        return { success: true, variant: matches[0].variant, isExactMapping: false, score: matches[0].score };
    }

    return { success: false, suggestedVariants: matches.slice(0, 3).map(m => m.variant) };
}

/**
 * AAE Auto Processor: Handlers the full order lifecycle automatically.
 */
export async function processAutonomousOrder(orderData: AutomatedOrderData) {
    try {
        // 1. Map all items
        const mappedItems: any[] = [];
        const unmappedItems: string[] = [];

        for (const item of orderData.items) {
            const match = await smartMatchProduct(orderData.brandId, item.externalName, orderData.platform);
            if (match.success && match.variant) {
                mappedItems.push({
                    variantId: match.variant.id,
                    name: match.variant.name,
                    quantity: item.quantity,
                    price: item.price
                });
            } else {
                unmappedItems.push(item.externalName);
            }
        }

        // 2. If any item is unmapped, create the order but mark as NEEEDS_MAPPING
        const isFullyMapped = unmappedItems.length === 0;
        const status = isFullyMapped ? 'DIBAYAR' : 'DIPESAN'; // DIBAYAR triggers KDS

        const count = await prisma.order.count({ where: { brandId: orderData.brandId } });
        const invoiceNo = `AUTO/${new Date().getFullYear()}/${count + 1}`;

        // Items summary for internal notes (since we don't have OrderItem table yet)
        const itemsSummary = orderData.items.map(item =>
            `${item.externalName} x${item.quantity}`
        ).join(', ');

        const order = await prisma.order.create({
            data: {
                brandId: orderData.brandId,
                channel: orderData.platform,
                externalOrderId: orderData.externalOrderId,
                invoiceNo,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                status: status as any,
                totalAmount: orderData.grandTotal,
                quantity: orderData.items.reduce((sum, i) => sum + i.quantity, 0),
                subtotal: orderData.grandTotal,
                total: orderData.grandTotal,
                internalNotes: `[AAE] Auto-Synced. Items: ${itemsSummary}${!isFullyMapped ? '\n\nWARNING: Missing Product Mapping!' : ''}`,
                syncedFromEmail: true,
                emailSyncedAt: new Date(),
            } as any
        });

        // 3. If fully mapped, perform side effects
        if (isFullyMapped) {
            // A. Deduct Stock
            for (const item of mappedItems) {
                await prisma.frozenVariant.updateMany({
                    where: { id: item.variantId, brandId: orderData.brandId },
                    data: { stockOnHand: { decrement: item.quantity } }
                });
            }

            // B. Record Sale in Finance Hub
            try {
                await JournalService.recordSale(
                    orderData.brandId,
                    order.id,
                    orderData.grandTotal,
                    orderData.platform
                );
            } catch (finErr) {
                console.error("[AAE] Financial recording failed:", finErr);
            }

            // C. 🎁 AUTO-AWARD LOYALTY POINTS
            if (orderData.customerPhone) {
                try {
                    const { processOrderLoyalty } = await import('../actions/rasa-ibu/businessIntelligence');
                    await processOrderLoyalty(
                        orderData.brandId,
                        orderData.customerPhone,
                        orderData.customerName,
                        orderData.grandTotal,
                        order.id
                    );
                } catch (loyaltyErr) {
                    console.error("[AAE] Loyalty points error (non-critical):", loyaltyErr);
                }
            }
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, orderId: order.id, autonomous: isFullyMapped };
    } catch (error: any) {
        console.error("[AAE] Critical processing error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Manual Mapping Helper: Links an external name to a variant for future auto-processing.
 */
export async function createProductMapping(data: {
    brandId: string;
    externalName: string;
    variantId: string;
    platform: string;
}) {
    try {
        await prisma.productMapping.upsert({
            where: {
                brandId_externalName_platform: {
                    brandId: data.brandId,
                    externalName: data.externalName,
                    platform: data.platform
                }
            },
            create: data,
            update: { variantId: data.variantId, automationActive: true }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
