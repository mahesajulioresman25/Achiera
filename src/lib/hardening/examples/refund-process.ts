// ACHIERA Platform - Hardened Refund Example
// Shows refund with ledger reversal and audit trail

import { withTransaction } from '@/lib/hardening/transaction';
import { withIdempotency } from '@/lib/hardening/idempotency';
import { safeStockAddition } from '@/lib/hardening/stock-safety';
import { recordRefund } from '@/lib/hardening/ledger-integrity';
import { createLogger } from '@/lib/hardening/logger';
import { auditRefund } from '@/lib/hardening/audit';
import type { CorrelationContext } from '@/lib/hardening/correlation';

export async function processRefund(
    context: CorrelationContext,
    orderId: string,
    reason: string
): Promise<void> {
    const logger = createLogger({ ...context, action: 'REFUND_PROCESS' });

    logger.info('Processing refund', { orderId, reason });

    // Idempotency key
    const idempotencyKey = `refund-${orderId}`;

    await withIdempotency(idempotencyKey, async () => {
        return withTransaction(async (tx) => {
            // 1. Get order
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status === 'REFUNDED') {
                throw new Error('Order already refunded');
            }

            // 2. Restore stock
            for (const item of order.items) {
                await safeStockAddition(
                    tx,
                    item.variantId,
                    item.quantity,
                    `REFUND-${orderId}`
                );
            }

            // 3. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'REFUNDED',
                    paymentStatus: 'REFUNDED'
                }
            });

            // 4. Create refund payment record
            await tx.payment.create({
                data: {
                    orderId,
                    amount: -Number(order.total),
                    method: order.paymentMethod,
                    status: 'REFUNDED',
                    paidAt: new Date()
                }
            });

            // 5. Record refund in ledger (reversal)
            await recordRefund(order.brandId, Number(order.total), orderId);

            // 6. Audit refund
            await auditRefund(context, orderId, Number(order.total), reason);

            logger.info('Refund completed', { orderId });
        });
    });
}
