'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function upsertBundleAction(campaignId: string, data: any) {
    const { id, items, ...rest } = data;

    try {
        // Calculate Base Price from Items
        let basePrice = 0;
        if (items && items.length > 0) {
            const variantIds = items.map((i: any) => i.variantId);
            const variants = await prisma.frozenVariant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, price: true }
            });

            const priceMap = new Map(variants.map(v => [v.id, Number(v.price)]));

            basePrice = items.reduce((acc: number, item: any) => {
                const price = priceMap.get(item.variantId) || 0;
                return acc + (price * (Number(item.quantity) || 1));
            }, 0);
        }

        let result;
        if (id) {
            // Update existing bundle
            result = await prisma.productBundle.update({
                where: { id },
                data: {
                    ...rest,
                    basePrice,
                    items: {
                        deleteMany: {}, // Clear existing items for simplicity in update
                        create: items.map((item: any) => ({
                            variantId: item.variantId,
                            quantity: Number(item.quantity) || 1
                        }))
                    }
                },
                include: { items: true }
            });
        } else {
            // Create new bundle
            result = await prisma.productBundle.create({
                data: {
                    ...rest,
                    campaignId,
                    basePrice,
                    items: {
                        create: items.map((item: any) => ({
                            variantId: item.variantId,
                            quantity: Number(item.quantity) || 1
                        }))
                    }
                },
                include: { items: true }
            });
        }

        return JSON.parse(JSON.stringify(result));
    } catch (error: any) {
        console.error('[upsertBundleAction] Error:', error);
        throw new Error(error.message || "Gagal menyimpan bundle");
    }
}

export async function deleteBundleAction(id: string) {
    try {
        await prisma.productBundle.delete({
            where: { id }
        });
        return { success: true };
    } catch (error: any) {
        console.error('[deleteBundleAction] Error:', error);
        throw new Error(error.message || "Gagal menghapus bundle");
    }
}
