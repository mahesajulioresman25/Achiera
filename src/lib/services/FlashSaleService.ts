import { unisolatedPrisma as prisma } from '@/lib/prisma';

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

            // console.log('[FlashSaleService] Config found:', config?.name || 'NONE');
            if (!config) return null;

            const now = new Date();
            // Combine Date and Time into full timestamps
            const getFullTimestamp = (date: Date | null, time: string) => {
                if (!date) return null;
                const ts = new Date(date);
                const [hours, mins] = time.split(':').map(Number);
                ts.setHours(hours, mins, 0, 0);
                return ts;
            };

            const fullStart = getFullTimestamp(config.startDate, config.startTime);
            const fullEnd = getFullTimestamp(config.endDate, config.endTime);

            const configData = {
                configId: config.id,
                name: config.name,
                discountPercentage: Number(config.discountPercentage),
                minPurchaseAmount: Number(config.minPurchaseAmount || 0),
                targetType: config.targetType || 'ALL',
                // @ts-ignore
                targetItems: Array.isArray(config.targetIds) ? config.targetIds : [],
                startDate: fullStart?.toISOString() || null,
                endDate: fullEnd?.toISOString() || null,
                startTime: config.startTime,
                endTime: config.endTime
            };

            // 1. Check if UPCOMING
            if (fullStart && now < fullStart) {
                return { ...configData, status: 'UPCOMING' };
            }

            // 2. Check if ACTIVE
            if (fullStart && fullEnd && now >= fullStart && now <= fullEnd) {
                return { ...configData, status: 'ACTIVE' };
            }

            // Fallback for cases without explicit dates (if any, though schema has them)
            if (!fullStart || !fullEnd) {
                const [startHour, startMin] = config.startTime.split(':').map(Number);
                const [endHour, endMin] = config.endTime.split(':').map(Number);
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                    return { ...configData, status: 'ACTIVE' };
                }
            }

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
