'use server';

import { prisma } from '@/lib/prisma';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { revalidatePath } from 'next/cache';

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

/**
 * Create a new Brand (Onboarding)
 */
export async function createBrandAction(params: { name: string; slug: string; adminUserId: string }) {
    try {
        const onboardingService = new OnboardingService();
        const brand = await onboardingService.onboardingBrand(params);

        revalidatePath('/dashboard/owner');
        revalidatePath('/dashboard/owner/brands');

        return {
            success: true,
            data: brand
        };
    } catch (error: any) {
        console.error('[createBrandAction] Error:', error);
        return { success: false, error: error.message || 'Gagal membuat brand baru' };
    }
}
