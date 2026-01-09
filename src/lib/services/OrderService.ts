// ACHIERA Platform - Order Service
// Order lifecycle management with payment and finance integration

import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { WarehouseService } from './WarehouseService';
import { LoyaltyService } from './LoyaltyService';
import type { ServiceContext } from './WarehouseService';

export type CreateOrderInput = {
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    items: Array<{
        variantId: string;
        quantity: number;
        unitPrice: number;
    }>;
    shippingCost?: number;
    loyaltyPointsUsed?: number;
};

export type ProcessPaymentInput = {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    proofImage?: string;
};

export class OrderService {
    private warehouseService = new WarehouseService();
    private loyaltyService = new LoyaltyService();

    /**
     * Create new order
     */
    async createOrder(ctx: ServiceContext, input: CreateOrderInput) {
        return prisma.$transaction(async (tx) => {
            // 1. Calculate totals
            const subtotal = input.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
            );

            const shippingCost = input.shippingCost || 0;
            const tax = subtotal * 0.11; // 11% VAT

            // Calculate loyalty discount
            let loyaltyDiscount = 0;
            if (input.loyaltyPointsUsed) {
                loyaltyDiscount = input.loyaltyPointsUsed; // 1 point = 1 IDR
            }

            const total = subtotal + shippingCost + tax - loyaltyDiscount;

            // 2. Generate order number
            const orderNumber = await this.generateOrderNumber(ctx.brandId);

            // 3. Create order
            const order = await tx.order.create({
                data: {
                    brandId: ctx.brandId,
                    userId: input.userId,
                    orderNumber,
                    customerName: input.customerName,
                    customerEmail: input.customerEmail,
                    customerPhone: input.customerPhone,
                    shippingAddress: input.shippingAddress,
                    subtotal,
                    shippingCost,
                    tax,
                    loyaltyDiscount,
                    total,
                    status: OrderStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID
                }
            });

            // 4. Create order items
            for (const item of input.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true }
                });

                if (!variant) {
                    throw new Error(`Variant ${item.variantId} not found`);
                }

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        variantId: item.variantId,
                        productName: variant.product.name,
                        variantName: variant.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.unitPrice * item.quantity
                    }
                });
            }

            // 5. Redeem loyalty points if used
            if (input.loyaltyPointsUsed && input.loyaltyPointsUsed > 0) {
                await this.loyaltyService.redeemPoints(
                    tx,
                    input.userId,
                    ctx.brandId,
                    input.loyaltyPointsUsed,
                    order.id
                );
            }

            // 6. Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'ORDER_CREATE',
                    entityType: 'ORDER',
                    entityId: order.id,
                    metadata: { orderNumber, total }
                }
            });

            return order;
        });
    }

    /**
     * Process payment and fulfill order
     */
    async processPayment(ctx: ServiceContext, input: ProcessPaymentInput) {
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: input.orderId },
                include: { items: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.paymentStatus === PaymentStatus.PAID) {
                throw new Error('Order already paid');
            }

            // 1. Create payment record
            const payment = await tx.payment.create({
                data: {
                    orderId: input.orderId,
                    amount: input.amount,
                    method: input.method,
                    status: PaymentStatus.PAID,
                    transactionId: input.transactionId,
                    proofImage: input.proofImage,
                    paidAt: new Date(),
                    verifiedBy: ctx.userId
                }
            });

            // 2. Update order status
            await tx.order.update({
                where: { id: input.orderId },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    status: OrderStatus.PROCESSING,
                    paidAt: new Date()
                }
            });

            // 3. Deduct stock (FIFO)
            const defaultWarehouse = await tx.warehouse.findFirst({
                where: { brandId: ctx.brandId, isActive: true }
            });

            if (!defaultWarehouse) {
                throw new Error('No active warehouse found');
            }

            for (const item of order.items) {
                await this.warehouseService.deductStock(
                    ctx,
                    defaultWarehouse.id,
                    item.variantId,
                    item.quantity,
                    order.id
                );
            }

            // 4. Record revenue in ledger
            await this.recordRevenue(tx, ctx.brandId, order.id, input.amount);

            // 5. Award loyalty points
            await this.loyaltyService.awardPoints(
                tx,
                order.userId,
                ctx.brandId,
                order.total,
                order.id
            );

            // 6. Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'PAYMENT_PROCESSED',
                    entityType: 'ORDER',
                    entityId: order.id,
                    metadata: { amount: input.amount, method: input.method }
                }
            });

            return payment;
        });
    }

    /**
     * Cancel order
     */
    async cancelOrder(ctx: ServiceContext, orderId: string, reason: string) {
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
                throw new Error('Cannot cancel shipped/delivered order');
            }

            // 1. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                    cancelledAt: new Date()
                }
            });

            // 2. Restore stock if already deducted
            if (order.status === OrderStatus.PROCESSING) {
                const warehouse = await tx.warehouse.findFirst({
                    where: { brandId: ctx.brandId, isActive: true }
                });

                if (warehouse) {
                    for (const item of order.items) {
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stockOnHand: { increment: item.quantity } }
                        });

                        await tx.stockMutation.create({
                            data: {
                                warehouseId: warehouse.id,
                                variantId: item.variantId,
                                type: 'ADJUSTMENT',
                                quantity: item.quantity,
                                referenceId: orderId,
                                notes: `Order cancelled: ${reason}`,
                                createdBy: ctx.userId
                            }
                        });
                    }
                }
            }

            // 3. Refund loyalty points if used
            if (order.loyaltyDiscount > 0) {
                await this.loyaltyService.refundPoints(
                    tx,
                    order.userId,
                    ctx.brandId,
                    order.loyaltyDiscount,
                    orderId
                );
            }

            // 4. Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'ORDER_CANCELLED',
                    entityType: 'ORDER',
                    entityId: orderId,
                    metadata: { reason }
                }
            });
        });
    }

    /**
     * Record revenue in ledger (double-entry)
     */
    private async recordRevenue(
        tx: any,
        brandId: string,
        orderId: string,
        amount: number
    ) {
        // Get ledger accounts
        const cashAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '1000-CASH' }
        });

        const revenueAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '4000-REVENUE' }
        });

        if (!cashAccount || !revenueAccount) {
            throw new Error('Ledger accounts not found');
        }

        // Create transaction
        const transaction = await tx.ledgerTransaction.create({
            data: {
                brandId,
                description: `Revenue from Order`,
                referenceId: orderId
            }
        });

        // Debit: Cash (increase asset)
        await tx.ledgerEntry.create({
            data: {
                transactionId: transaction.id,
                accountId: cashAccount.id,
                debit: amount,
                credit: 0
            }
        });

        // Credit: Revenue (increase revenue)
        await tx.ledgerEntry.create({
            data: {
                transactionId: transaction.id,
                accountId: revenueAccount.id,
                debit: 0,
                credit: amount
            }
        });
    }

    /**
     * Generate unique order number
     */
    private async generateOrderNumber(brandId: string): Promise<string> {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { slug: true }
        });

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const count = await prisma.order.count({
            where: {
                brandId,
                createdAt: {
                    gte: new Date(date.getFullYear(), date.getMonth(), date.getDate())
                }
            }
        });

        const sequence = (count + 1).toString().padStart(4, '0');

        return `${brand?.slug.toUpperCase()}-${year}${month}${day}-${sequence}`;
    }

    /**
     * Get orders for brand
     */
    async getOrders(
        brandId: string,
        filters?: {
            status?: OrderStatus;
            userId?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ) {
        return prisma.order.findMany({
            where: {
                brandId,
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.userId ? { userId: filters.userId } : {}),
                ...(filters?.startDate || filters?.endDate
                    ? {
                        createdAt: {
                            ...(filters.startDate ? { gte: filters.startDate } : {}),
                            ...(filters.endDate ? { lte: filters.endDate } : {})
                        }
                    }
                    : {})
            },
            include: {
                items: true,
                payments: true,
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
