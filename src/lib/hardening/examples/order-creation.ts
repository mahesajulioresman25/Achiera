// ACHIERA Platform - Hardened Order Creation Example
// Shows integration of all hardening utilities

import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/hardening/transaction';
import { withIdempotency, generateIdempotencyKey } from '@/lib/hardening/idempotency';
import { safeStockDeduction } from '@/lib/hardening/stock-safety';
import { recordRevenue } from '@/lib/hardening/ledger-integrity';
import { createLogger } from '@/lib/hardening/logger';
import { extractCorrelationId, createCorrelationContext } from '@/lib/hardening/correlation';
import { handleError } from '@/lib/hardening/error-handler';
import { BusinessErrors } from '@/lib/hardening/errors';
import { auditPaymentConfirm, auditStockMutation } from '@/lib/hardening/audit';
import { checkKillSwitch } from '@/lib/hardening/kill-switch';
import { checkWriteAllowed } from '@/lib/hardening/degradation';

export async function POST(request: NextRequest) {
    // Extract correlation ID
    const correlationId = extractCorrelationId(request.headers);

    try {
        const body = await request.json();
        const { userId, brandId, items, total, paymentMethod } = body;

        // Create correlation context
        const context = createCorrelationContext(correlationId, brandId, userId);
        const logger = createLogger({ ...context, action: 'ORDER_CREATE' });

        logger.info('Creating order', { itemCount: items.length, total });

        // Check kill switch
        const killSwitchCheck = await checkKillSwitch('FREEZE_ALL_ORDERS', brandId);
        if (!killSwitchCheck.allowed) {
            throw BusinessErrors.BRAND_FROZEN(brandId);
        }

        // Check degradation mode
        const writeCheck = await checkWriteAllowed();
        if (!writeCheck.allowed) {
            throw new Error(writeCheck.reason);
        }

        // Generate idempotency key
        const idempotencyKey = generateIdempotencyKey('create_order', userId, items, total);

        // Execute with idempotency
        const order = await withIdempotency(idempotencyKey, async () => {
            return withTransaction(async (tx) => {
                // 1. Create order
                const order = await tx.order.create({
                    data: {
                        brandId,
                        userId,
                        orderNumber: `ORD-${Date.now()}`,
                        total,
                        paymentMethod,
                        status: 'PENDING',
                        paymentStatus: 'UNPAID'
                    }
                });

                logger.info('Order created', { orderId: order.id });

                // 2. Create order items
                for (const item of items) {
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.price
                        }
                    });
                }

                // 3. Deduct stock (FIFO-safe)
                for (const item of items) {
                    const beforeStock = await tx.frozenVariant.findUnique({
                        where: { id: item.variantId },
                        select: { stockOnHand: true }
                    });

                    await safeStockDeduction(tx, item.variantId, item.quantity, order.id);

                    const afterStock = await tx.frozenVariant.findUnique({
                        where: { id: item.variantId },
                        select: { stockOnHand: true }
                    });

                    // Audit stock mutation
                    await auditStockMutation(
                        context,
                        item.variantId,
                        item.quantity,
                        'DEDUCT',
                        beforeStock?.stockOnHand || 0,
                        afterStock?.stockOnHand || 0
                    );
                }

                // 4. Record payment
                const payment = await tx.payment.create({
                    data: {
                        orderId: order.id,
                        amount: total,
                        method: paymentMethod,
                        status: 'PAID',
                        paidAt: new Date()
                    }
                });

                // 5. Update order status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'PAID',
                        status: 'PROCESSING',
                        paidAt: new Date()
                    }
                });

                // 6. Record revenue in ledger (double-entry)
                await recordRevenue(brandId, total, order.id);

                // 7. Audit payment confirmation
                await auditPaymentConfirm(context, order.id, total, paymentMethod);

                logger.info('Order completed', { orderId: order.id });

                return order;
            });
        });

        // Return success response with correlation ID
        return NextResponse.json(
            { order, correlationId },
            {
                headers: {
                    'X-Correlation-ID': correlationId
                }
            }
        );

    } catch (error) {
        const context = createCorrelationContext(correlationId);
        return handleError(error as Error, context);
    }
}
