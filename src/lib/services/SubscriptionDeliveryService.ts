import { prisma } from '@/lib/prisma';
import { WarehouseService } from './WarehouseService';

export class SubscriptionDeliveryService {
    /**
     * Process all deliveries scheduled for today
     */
    static async processDailyDeliveries() {
        const today = new Date();
        const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()];

        console.log(`[SubscriptionDelivery] Processing deliveries for ${dayOfWeek} (${today.toISOString().split('T')[0]})`);

        // Find active subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                items: { include: { variant: true } },
                brand: true
            }
        });

        // Filter by delivery day
        const subscriptionsForToday = subscriptions.filter(sub => {
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
    static async createDeliveryAndDeductStock(subscription: any) {
        // Check if delivery already created for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await prisma.subscriptionDelivery.findFirst({
            where: {
                subscriptionId: subscription.id,
                deliveryDate: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        if (existing) {
            console.log(`[SubscriptionDelivery] Delivery already exists for subscription ${subscription.id} on ${today.toISOString().split('T')[0]}`);
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
                deliveryDate: today,
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
}
