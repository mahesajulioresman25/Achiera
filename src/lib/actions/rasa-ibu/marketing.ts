
'use server';

import { prisma } from '@/lib/prisma';
import { VoucherService } from '@/lib/services/VoucherService';
import { revalidatePath } from 'next/cache';

export async function getVouchersAction(brandId: string) {
    try {
        const vouchers = await prisma.pricingRule.findMany({
            where: {
                brandId,
                code: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: vouchers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createVoucherAction(data: {
    brandId: string,
    code: string,
    discountType: 'FIXED' | 'PERCENT',
    discountAmount: number,
    usageLimit?: number,
    minOrderAmount?: number,
    startDate?: Date,
    endDate?: Date,
    description?: string
}) {
    try {
        const service = new VoucherService();
        await service.createVoucher({
            ...data,
            targetVariants: undefined // Apply to cart total generally
        });
        revalidatePath('/dashboard/rasa-ibu/marketing/vouchers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleVoucherStatusAction(brandId: string, code: string, isActive: boolean) {
    try {
        await prisma.pricingRule.update({
            where: { brandId_code: { brandId, code } },
            data: { isActive }
        });
        revalidatePath('/dashboard/rasa-ibu/marketing/vouchers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteVoucherAction(brandId: string, code: string) {
    try {
        await prisma.pricingRule.delete({
            where: { brandId_code: { brandId, code } }
        });
        revalidatePath('/dashboard/rasa-ibu/marketing/vouchers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
