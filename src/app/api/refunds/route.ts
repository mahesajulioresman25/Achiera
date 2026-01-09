// ACHIERA Platform - Refund API Route
// Protected refund endpoint with full transaction safety

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AccessContext } from '@/lib/auth/requireAccess';
import { validateBrandAccess } from '@/lib/auth/brandIsolation';
import { processRefund, processPartialRefund } from '@/lib/hardening/refund';
import { createLogger } from '@/lib/hardening/logger';
import { extractCorrelationId, createCorrelationContext } from '@/lib/hardening/correlation';
import { auditRefund, auditRefundApproval } from '@/lib/hardening/audit';

/**
 * Create Refund - Protected Route
 * Requires: refund:create permission + brand access
 */
export const POST = withAuth(
    async (request: NextRequest, context: AccessContext) => {
        const correlationId = extractCorrelationId(request.headers);
        const logger = createLogger({
            correlationId,
            brandId: context.brandId,
            userId: context.userId,
            action: 'REFUND_CREATE'
        });

        try {
            const body = await request.json();
            const { orderId, amount, items, reason } = body;

            // Get order to validate brand
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { brandId: true }
            });

            if (!order) {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }

            // Validate brand access
            validateBrandAccess(context.brandId || null, order.brandId, context.role);

            logger.info('Processing refund', { orderId, amount });

            const refundContext = createCorrelationContext(
                correlationId,
                order.brandId,
                context.userId
            );

            // Process full or partial refund
            const result = items
                ? await processPartialRefund(orderId, items, refundContext)
                : await processRefund(orderId, amount, refundContext);

            logger.info('Refund processed successfully', { refundId: result.id });

            return NextResponse.json(
                { refund: result, correlationId },
                {
                    headers: {
                        'X-Correlation-ID': correlationId
                    }
                }
            );

        } catch (error) {
            logger.error('Refund processing failed', error as Error);

            return NextResponse.json(
                { error: 'Refund processing failed', message: (error as Error).message },
                { status: 500 }
            );
        }
    },
    {
        permission: 'refund:create'
    }
);

/**
 * Approve Refund - Protected Route
 * Requires: refund:approve permission + brand access
 */
export async function PATCH(request: NextRequest) {
    return withAuth(
        async (req: NextRequest, context: AccessContext) => {
            const correlationId = extractCorrelationId(req.headers);
            const logger = createLogger({
                correlationId,
                brandId: context.brandId,
                userId: context.userId,
                action: 'REFUND_APPROVE'
            });

            try {
                const body = await req.json();
                const { refundId, approved, reason } = body;

                // Get refund to validate brand
                const refund = await prisma.refund.findUnique({
                    where: { id: refundId },
                    include: {
                        order: {
                            select: { brandId: true }
                        }
                    }
                });

                if (!refund) {
                    return NextResponse.json(
                        { error: 'Refund not found' },
                        { status: 404 }
                    );
                }

                // Validate brand access
                validateBrandAccess(
                    context.brandId || null,
                    refund.order.brandId,
                    context.role
                );

                // Update refund status
                const updated = await prisma.refund.update({
                    where: { id: refundId },
                    data: {
                        status: approved ? 'APPROVED' : 'REJECTED',
                        approvedBy: context.userId,
                        approvedAt: new Date(),
                        rejectionReason: approved ? null : reason
                    }
                });

                // Audit approval
                const auditContext = createCorrelationContext(
                    correlationId,
                    refund.order.brandId,
                    context.userId
                );
                await auditRefundApproval(auditContext, refundId, approved, reason);

                logger.info('Refund approval processed', { refundId, approved });

                return NextResponse.json({ refund: updated });

            } catch (error) {
                logger.error('Refund approval failed', error as Error);

                return NextResponse.json(
                    { error: 'Refund approval failed', message: (error as Error).message },
                    { status: 500 }
                );
            }
        },
        {
            permission: 'refund:approve'
        }
    )(request);
}

/**
 * Get Refunds - Protected Route
 * Requires: refund:read permission + brand access
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

            // Query refunds
            const refunds = await prisma.refund.findMany({
                where: {
                    order: {
                        brandId // Brand isolation enforced
                    }
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            total: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            return NextResponse.json({ refunds });
        },
        {
            permission: 'finance:read' // Finance can view refunds
        }
    )(request);
}
