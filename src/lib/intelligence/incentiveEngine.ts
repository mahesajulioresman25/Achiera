import { unisolatedPrisma as prisma } from '@/lib/prisma';

export interface IncentiveRule {
    type: 'PERCENT' | 'FIXED';
    value: number;
    category?: string; // e.g., 'Merch', 'Food'
}

export class IncentiveEngine {
    /**
     * Calculates and records commission for a specific order
     */
    static async processOrderIncentive(orderId: string, operatorId: string) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { brand: true, orderItems: true }
            });

            if (!order || !operatorId) return;

            // Logic: 
            // - If Merch (Achiera Merch): 5% of total
            // - If Food (Rasa Ibu): Rp 2,000 fixed per item
            let commissionAmount = 0;

            if (order.brand?.slug === 'achiera-merch') {
                commissionAmount = Number(order.total) * 0.05;
            } else if (order.brand?.slug === 'rasa-ibu') {
                commissionAmount = order.orderItems.length * 2000;
            } else {
                // Default: 2% of total
                commissionAmount = Number(order.total) * 0.02;
            }

            if (commissionAmount <= 0) return;

            // Record in AuditLog for tracking
            await (prisma as any).auditLog.create({
                data: {
                    userId: operatorId,
                    userName: 'System (Incentive Engine)',
                    userRole: 'BRAND_ADMIN',
                    action: 'COMMISSION_EARNED' as any,
                    entityType: 'Order',
                    entityId: orderId,
                    brandId: order.brandId,
                    metadata: {
                        amount: commissionAmount,
                        reason: `Commission for Order ${order.invoiceNo}`,
                        brandSlug: order.brand?.slug
                    },
                    severity: 'INFO'
                }
            });

            return commissionAmount;
        } catch (error) {
            console.error('Incentive Engine Error:', error);
            return 0;
        }
    }
}
