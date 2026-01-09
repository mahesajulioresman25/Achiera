import { prisma } from '@/lib/prisma';

export interface FlashSaleInfo {
    configId: string;
    name: string;
    discountPercentage: number;
    minPurchaseAmount: number;
    targetType?: string;
    targetItems?: string[];
    startDate?: string | null;
    endDate?: string | null;
    startTime: string;
    endTime: string;
    status: 'ACTIVE' | 'UPCOMING';
}

export class FlashSaleService {

    /**
     * Check if there is an active flash sale for a brand at the current moment.
     */
    static async getActiveFlashSale(brandId: string): Promise<FlashSaleInfo | null> {
        try {
            const config = await prisma.flashSaleConfig.findFirst({
                where: { brandId: brandId, isActive: true },
                include: { items: true }
            });

            console.log('[FlashSaleService] Config found:', config?.name || 'NONE');
            if (!config) return null;

            const now = new Date();
            // 1. Check Date Range (Compare using YYYY-MM-DD strings for timezone safety)
            const todayStr = now.toISOString().split('T')[0];
            // @ts-ignore
            const startStr = config.startDate ? new Date(config.startDate).toISOString().split('T')[0] : null;
            // @ts-ignore
            const endStr = config.endDate ? new Date(config.endDate).toISOString().split('T')[0] : null;

            if (startStr && todayStr < startStr) {
                console.log('[FlashSaleService] NOT ACTIVE: todayStr < startStr', todayStr, startStr);
                return null;
            }
            if (endStr && todayStr > endStr) {
                console.log('[FlashSaleService] NOT ACTIVE: todayStr > endStr', todayStr, endStr);
                return null;
            }

            // 2. Check Time Range
            // "11:00" -> HH:mm
            const [startHour, startMin] = config.startTime.split(':').map(Number);
            const [endHour, endMin] = config.endTime.split(':').map(Number);

            const currentHour = now.getHours();
            const currentMin = now.getMinutes();

            const currentMinutes = currentHour * 60 + currentMin;
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            const configData = {
                configId: config.id,
                name: config.name,
                discountPercentage: Number(config.discountPercentage),
                minPurchaseAmount: Number(config.minPurchaseAmount || 0),
                targetType: config.targetType || 'ALL',
                // @ts-ignore
                targetItems: Array.isArray(config.targetIds) ? config.targetIds : [],
                // @ts-ignore
                startDate: config.startDate ? (config.startDate as any).toISOString() : null,
                // @ts-ignore
                endDate: config.endDate ? (config.endDate as any).toISOString() : null,
                startTime: config.startTime,
                endTime: config.endTime
            };

            if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                console.log('[FlashSaleService] Flash Sale is ACTIVE');
                return { ...configData, status: 'ACTIVE' };
            }

            if (currentMinutes < startMinutes) {
                console.log('[FlashSaleService] Flash Sale is UPCOMING');
                return { ...configData, status: 'UPCOMING' };
            }

            console.log('[FlashSaleService] Flash Sale is NOT ACTIVE (Already Ended today)');
            return null;

        } catch (error) {
            console.error("Error Checking Flash Sale:", error);
            return null;
        }
    }

    static calculateDiscount(subtotal: number, flashSale: FlashSaleInfo, items: any[] = []): number {
        // If SPECIFIC target, only discount matching items (by product ID or variant ID)
        if (flashSale.targetType === 'SPECIFIC' && flashSale.targetItems) {
            const targetIds = new Set(flashSale.targetItems);
            let discountableTotal = 0;

            for (const item of items) {
                // Check if it matches a target product ID or variant ID
                const productId = item.productId || item.product?.id;
                const variantId = item.variantId || item.frozenVariantId;

                if (targetIds.has(productId) || targetIds.has(variantId)) {
                    const price = Number(item.price || item.basePrice || 0);
                    const qty = Number(item.quantity || 1);
                    discountableTotal += (price * qty);
                }
            }

            if (discountableTotal < flashSale.minPurchaseAmount) return 0;
            const discountAmount = discountableTotal * (flashSale.discountPercentage / 100);
            return Math.floor(discountAmount);
        }

        // Default ALL logic
        if (subtotal < flashSale.minPurchaseAmount) return 0;
        const discountAmount = subtotal * (flashSale.discountPercentage / 100);
        return Math.floor(discountAmount);
    }
}
