// ACHIERA Platform - Protected Order API Example
// Demonstrates RBAC enforcement and brand isolation

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AccessContext } from '@/lib/auth/requireAccess';
import { validateBrandAccess } from '@/lib/auth/brandIsolation';
import { prisma } from '@/lib/prisma';
import { withTransaction } from '@/lib/hardening/transaction';
import { withIdempotency, generateIdempotencyKey } from '@/lib/hardening/idempotency';
import { safeStockDeduction } from '@/lib/hardening/stock-safety';
import { recordRevenue } from '@/lib/hardening/ledger-integrity';
import { createLogger } from '@/lib/hardening/logger';
import { extractCorrelationId } from '@/lib/hardening/correlation';

/**
 * Create Order - Protected Route
 * Requires: order:create permission + brand access
 */
export const POST = withAuth(
    async (request: NextRequest, context: AccessContext) => {
        const correlationId = extractCorrelationId(request.headers);
        const logger = createLogger({
            correlationId,
            brandId: context.brandId,
            userId: context.userId,
            action: 'ORDER_CREATE'
        });

        try {
            const body = await request.json();
            const { brandId, items, total, paymentMethod } = body;

            // Validate brand access
            validateBrandAccess(context.brandId || null, brandId, context.role);

            logger.info('Creating order', { itemCount: items.length, total });

            // Generate idempotency key
            const idempotencyKey = generateIdempotencyKey(
                'create_order',
                context.userId,
                brandId,
                items,
                total
            );

            // Execute with idempotency
            const order = await withIdempotency(idempotencyKey, async () => {
                return withTransaction(async (tx) => {
                    // 1. Create order
                    const order = await tx.order.create({
                        data: {
                            brandId, // Required by brand isolation
                            userId: context.userId,
                            orderNumber: `ORD-${Date.now()}`,
                            total,
                            paymentMethod,
                            status: 'PENDING',
                            paymentStatus: 'UNPAID'
                        }
                    });

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

                    // 3. Deduct stock
                    for (const item of items) {
                        await safeStockDeduction(
                            tx,
                            item.variantId,
                            item.quantity,
                            order.id
                        );
                    }

                    // 4. Record payment
                    await tx.payment.create({
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

                    // 6. Record revenue in ledger
                    await recordRevenue(brandId, total, order.id, tx);

                    logger.info('Order created successfully', { orderId: order.id });

                    return order;
                });
            });

            return NextResponse.json(
                { order, correlationId },
                {
                    headers: {
                        'X-Correlation-ID': correlationId
                    }
                }
            );

        } catch (error) {
            logger.error('Order creation failed', error as Error);
            throw error;
        }
    },
    {
        permission: 'order:create'
        // brandId will be validated from request body
    }
);

/**
 * Get Orders - Protected Route
 * Requires: order:read permission + brand access
 */
export async function GET(request: NextRequest) {
    return withAuth(
        async (req: NextRequest, context: AccessContext) => {
            const { searchParams } = new URL(req.url);
            const brandId = searchParams.get('brandId');

            if (!brandId) {
                return NextResponse.json(
                    { error: 'brandId is required' },
                    { status: 400 }
                );
            }

            // Validate brand access
            validateBrandAccess(context.brandId || null, brandId, context.role);

            // Query with brandId (enforced by middleware)
            const orders = await prisma.order.findMany({
                where: { brandId }, // Required by brand isolation
                include: {
                    items: {
                        include: {
                            variant: true
                        }
                    },
                    payment: true
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            return NextResponse.json({ orders });
        },
        {
            permission: 'order:read'
        }
    )(request);
}
