'use server';

import { FlashSaleService } from '@/lib/services/FlashSaleService';

export async function checkFlashSaleAction(brandId: string = 'rasa-ibu') {
    // In future, brandId handles multi-brand. For now default to rasa-ibu.
    // Better to fetch brandId by slug if needed.
    // But typically public pages know their brand context.

    // We assume 'rasa-ibu' ID needs lookup or we pass it from client if available.
    // Ideally we pass brandId.

    // For now, let's assume we find the brand first or use exact ID if known.
    // Actually, `FlashSaleService` expects UUID. 
    // We'll need to fetch brand by slug if ID not provided.

    const { prisma } = await import('@/lib/prisma');
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return null;

    const flashSale = await FlashSaleService.getActiveFlashSale(brand.id);

    if (flashSale) {
        return {
            name: flashSale.name,
            discount: flashSale.discountPercentage,
            endTime: "13:00" // Should come from config
        };
    }

    return null;
}

export async function upsertFlashSaleConfig(data: any, brandIdInput: string) {
    if (!brandIdInput) {
        console.error('[upsertFlashSaleConfig] Error: brandIdInput is missing');
        throw new Error("Missing Brand ID. Silakan segarkan halaman dan coba lagi.");
    }

    const { prisma } = await import('@/lib/prisma');
    try {
        const { id, targetType, description, ...rest } = data;

        let brandId = brandIdInput;
        if (!brandId.startsWith('c')) {
            const brand = await prisma.brand.findUnique({ where: { slug: brandIdInput } });
            if (brand) brandId = brand.id;
        }

        const payload = {
            ...rest,
            brandId,
            startDate: rest.startDate ? new Date(rest.startDate) : null,
            endDate: rest.endDate ? new Date(rest.endDate) : null,
            targetType: targetType || "ALL",
        };

        let result;
        if (id) {
            result = await prisma.flashSaleConfig.update({
                where: { id },
                data: payload
            });
        } else {
            result = await prisma.flashSaleConfig.create({
                data: payload
            });
        }

        return JSON.parse(JSON.stringify(result));
    } catch (error: any) {
        console.error('[upsertFlashSaleConfig] Error:', error);
        throw error;
    }
}

export async function deleteFlashSaleAction(id: string, brandId: string) {
    try {
        const config = await prisma.flashSaleConfig.findFirst({
            where: { id, brandId }
        });

        if (!config) {
            throw new Error("Konfigurasi Flash Sale tidak ditemukan atau Anda tidak memiliki akses.");
        }

        await prisma.flashSaleConfig.delete({
            where: { id }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[deleteFlashSaleAction] Error:', error);
        throw new Error(error.message || "Gagal menghapus konfigurasi Flash Sale");
    }
}
