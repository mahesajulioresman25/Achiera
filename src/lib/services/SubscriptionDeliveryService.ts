import { prisma } from '@/lib/prisma';
import { WarehouseService } from './WarehouseService';

export class SubscriptionDeliveryService {
    /**
     * Process all deliveries scheduled for today
     */
    static async processDailyDeliveries(brandId?: string) {
        const today = new Date();
        const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()];

        console.log(`[SubscriptionDelivery] Processing deliveries for ${dayOfWeek} (${today.toISOString().split('T')[0]})`);

        // Find active subscriptions
        const whereClause: any = { status: 'ACTIVE' };
        if (brandId) {
            whereClause.brandId = brandId;
        }

        const subscriptions = await prisma.subscription.findMany({
            where: whereClause,
            include: {
                items: { include: { variant: true } },
                brand: true
            }
        });

        // Filter by delivery day
        const subscriptionsForToday = subscriptions.filter((sub: any) => {
            if (!sub.deliveryDays) return false;

            try {
                const deliveryDays = typeof sub.deliveryDays === 'string'
                    ? JSON.parse(sub.deliveryDays)
                    : sub.deliveryDays;

                if (!Array.isArray(deliveryDays)) return false;

                return deliveryDays.some((d: any) => d.day === dayOfWeek);
            } catch (e) {
                console.error(`Failed to parse deliveryDays for subscription ${sub.id}:`, e);
                return false;
            }
        });

        console.log(`[SubscriptionDelivery] Found ${subscriptionsForToday.length} subscriptions for delivery today`);

        const results = [];
        for (const sub of subscriptionsForToday) {
            try {
                const result = await this.createDeliveryAndDeductStock(sub);
                results.push({ subscriptionId: sub.id, success: true, deliveryId: result?.id });
            } catch (error: any) {
                console.error(`[SubscriptionDelivery] Failed for subscription ${sub.id}:`, error);
                results.push({ subscriptionId: sub.id, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Create delivery record and deduct stock
     */
    static async createDeliveryAndDeductStock(subscription: any, customDate?: Date) {
        // Check if delivery already created for today or customDate
        const targetDate = customDate || new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const existing = await prisma.subscriptionDelivery.findFirst({
            where: {
                subscriptionId: subscription.id,
                deliveryDate: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            }
        });

        if (existing) {
            console.log(`[SubscriptionDelivery] Delivery already exists for subscription ${subscription.id} on ${targetDate.toISOString().split('T')[0]}`);
            return existing;
        }

        // Get default warehouse
        const warehouse = await prisma.warehouse.findFirst({
            where: { brandId: subscription.brandId, isDefault: true }
        });

        if (!warehouse) {
            throw new Error(`No default warehouse found for brand ${subscription.brandId}`);
        }

        // Create delivery record
        const delivery = await prisma.subscriptionDelivery.create({
            data: {
                subscriptionId: subscription.id,
                deliveryDate: startOfDay,
                status: 'SCHEDULED',
                warehouseId: warehouse.id
            }
        });

        // Deduct stock for each item
        const warehouseService = new WarehouseService();
        const ctx = { brandId: subscription.brandId, userId: 'SYSTEM_DELIVERY' };

        try {
            for (const item of subscription.items) {
                await warehouseService.deductStock(
                    ctx,
                    warehouse.id,
                    item.variantId,
                    item.quantity,
                    `SUB-DELIVERY-${delivery.id}`
                );
            }

            // Mark stock as deducted
            await prisma.subscriptionDelivery.update({
                where: { id: delivery.id },
                data: { stockDeducted: true, status: 'PREPARING' }
            });

            console.log(`✅ Stock deducted for subscription ${subscription.id}, delivery ${delivery.id}`);

            return delivery;
        } catch (error: any) {
            console.error(`❌ Failed to deduct stock for subscription ${subscription.id}:`, error);

            await prisma.subscriptionDelivery.update({
                where: { id: delivery.id },
                data: {
                    status: 'FAILED',
                    notes: `Stock deduction failed: ${error.message}`
                }
            });

            throw error;
        }
    }

    /**
     * Get delivery history for a subscription
     */
    static async getDeliveryHistory(subscriptionId: string) {
        return prisma.subscriptionDelivery.findMany({
            where: { subscriptionId },
            orderBy: { deliveryDate: 'desc' },
            include: {
                warehouse: {
                    select: { name: true }
                }
            }
        });
    }

    /**
     * Calculate the next upcoming delivery date based on scheduled days
     */
    static getNextDeliveryDate(deliveryDays: any): Date {
        const today = new Date();
        const daysOrder = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

        let days: string[] = [];
        try {
            const parsed = typeof deliveryDays === 'string' ? JSON.parse(deliveryDays) : deliveryDays;
            if (Array.isArray(parsed)) {
                days = parsed.map((d: any) => d.day);
            }
        } catch (e) {
            console.error("[SubscriptionDelivery] Failed to parse deliveryDays:", e);
        }

        if (days.length === 0) return today; // Default to today if no schedule

        // Find the earliest next day
        let minDiff = 8;
        let nextDate = new Date(today);

        for (const dayName of days) {
            const dayIndex = daysOrder.indexOf(dayName);
            if (dayIndex === -1) continue;

            let diff = dayIndex - today.getDay();
            if (diff <= 0) diff += 7; // If today or earlier in the week, move to next week

            if (diff < minDiff) {
                minDiff = diff;
            }
        }

        nextDate.setDate(today.getDate() + minDiff);
        return nextDate;
    }
}
