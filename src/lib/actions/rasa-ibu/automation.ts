'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProductMappings(brandId: string) {
    try {
        const mappings = await prisma.productMapping.findMany({
            where: { brandId },
            include: { variant: { include: { product: true } } },
            orderBy: { externalName: 'asc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(mappings)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteProductMapping(mappingId: string) {
    try {
        await prisma.productMapping.delete({ where: { id: mappingId } });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleMappingAutomation(mappingId: string, active: boolean) {
    try {
        await prisma.productMapping.update({
            where: { id: mappingId },
            data: { automationActive: active }
        });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUnmappedMarketplaceItems(brandId: string) {
    try {
        // Find orders from marketplaces that have "Missing Product Mapping" in internalNotes
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                syncedFromEmail: true,
                internalNotes: { contains: 'Missing Product Mapping' },
                status: 'DIPESAN'
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Extract potential names from internalNotes
        const items = orders.map(o => {
            const match = (o.internalNotes || '').match(/Items: ([^,\n]+)/);
            return {
                orderId: o.id,
                platform: o.channel,
                externalName: match ? match[1].split(' x')[0].trim() : 'Unknown',
                timestamp: o.createdAt
            };
        });

        return { success: true, data: JSON.parse(JSON.stringify(items)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
