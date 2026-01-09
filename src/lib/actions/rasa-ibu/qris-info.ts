'use server';

import { prisma } from '@/lib/prisma';

export async function getQRISInfoAction(brandId: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const settings = (brand?.paymentSettings as any) || {};
        return {
            success: true,
            qrisImageUrl: settings.qrisImageUrl,
            qrisEnabled: settings.qrisEnabled
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
