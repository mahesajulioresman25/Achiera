'use server';

import { prisma } from '@/lib/prisma';

/**
 * Get all active brands
 */
export async function getAllBrandsAction() {
    try {
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: {
                id: true,
                slug: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });

        return {
            success: true,
            data: brands
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
