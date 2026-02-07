// ACHIERA Platform - Order Service
// Order lifecycle management with payment and finance integration

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { WarehouseService } from './WarehouseService';
import { LoyaltyService } from './LoyaltyService';
import type { ServiceContext } from './WarehouseService';
import { logSystemActivity } from '@/lib/logger';

export type CreateOrderInput = {
    brandId: string;
    userId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress: string;
    customerNote?: string;
    items: Array<{
        variantId: string; // This can be frozenVariantId
        name: string;
        variantName?: string;
        quantity: number;
        price: number;
        note?: string;
        productBundleId?: string;
        type?: string;
    }>;
    channel?: string;
    paymentMethod?: string;
    loyaltyPointsUsed?: number;
    deliveryOption?: string;
    courierType?: string;
    isGift?: boolean;
    giftMessage?: string;
    recipientName?: string;
    recipientEmail?: string;
    internalNotes?: string;
    voucherCode?: string;
};

export type ProcessPaymentInput = {
    orderId: string;
    amount: number;
    method: string;
    transactionId?: string;
    proofImage?: string;
    channel?: string;
};

export class OrderService {
    private warehouseService = new WarehouseService();
    private loyaltyService = new LoyaltyService();

    /**
     * Create new order (Status: DIPESAN)
     * Does NOT deduct stock yet, only validates availability.
     */
    async createOrder(ctx: ServiceContext, input: CreateOrderInput) {
        return prisma.$transaction(async (tx) => {
            // 1. Calculate totals
            const subtotal = input.items.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0
            );

            // Handle Loyalty Redemption
            let loyaltyDiscount = 0;
            if (input.loyaltyPointsUsed && input.loyaltyPointsUsed > 0) {
                const { getPlatformSettingsAction } = await import('@/lib/actions/rasa-ibu/finance');
                const settingsRes = await getPlatformSettingsAction(input.brandId);
                const pointValue = settingsRes.success ? (settingsRes.settings?.loyalty?.pointValueInRupiah || 100) : 100;
                loyaltyDiscount = input.loyaltyPointsUsed * pointValue;
            }

            // Handle Voucher
            let voucherDiscount = 0;
            if (input.voucherCode) {
                const { VoucherService } = await import('./VoucherService');
                const voucherService = new VoucherService();

                const validation = await voucherService.validateVoucher(input.brandId, input.voucherCode, subtotal);

                if (!validation.isValid) {
                    throw new Error(validation.error || 'Invalid Voucher');
                }

                voucherDiscount = validation.discountAmount || 0;

                // Increment Usage (Transactional)
                await voucherService.incrementUsage(input.voucherCode, input.brandId, tx);
            }

            // Handle Flash Sale (Optional - can be passed via internalNotes/total if already calculated)
            // For now, we assume the total passed or calculated is final.
            const total = Math.max(0, subtotal - loyaltyDiscount - voucherDiscount);

            // 2. Generate unique identifiers
            const invoiceNo = `INV-${input.channel === 'WEBSITE' ? 'WEB' : 'MAN'}-${Date.now()}`;
            const manualRef = `RI-${input.channel === 'WEBSITE' ? 'W' : 'M'}-${Math.floor(1000 + Math.random() * 9000)}`;

            // 3. Create order record
            const order = await tx.order.create({
                data: {
                    brandId: input.brandId,
                    userId: input.userId,
                    invoiceNo,
                    manualRef,
                    customerName: input.customerName,
                    customerEmail: input.customerEmail,
                    customerPhone: input.customerPhone,
                    customerAddress: input.customerAddress,
                    customerNote: input.customerNote,
                    subtotal,
                    tax: 0,
                    total: total,
                    totalAmount: total,
                    discountAmount: voucherDiscount,
                    voucherCode: input.voucherCode,
                    status: 'DIPESAN',
                    channel: input.channel || 'WEBSITE',
                    paymentMethod: input.paymentMethod,
                    isGift: input.isGift || false,
                    giftMessage: input.giftMessage,
                    recipientName: input.recipientName,
                    recipientEmail: input.recipientEmail,
                    internalNotes: input.internalNotes,
                    courierName: input.courierType || input.deliveryOption,
                    orderItems: {
                        create: input.items.map(item => ({
                            name: item.name,
                            variantName: item.variantName || '',
                            quantity: Number(item.quantity),
                            price: Number(item.price),
                            subtotal: Number(item.price) * Number(item.quantity),
                            frozenVariantId: item.variantId,
                            note: item.note,
                            productBundleId: item.productBundleId,
                            priceType: item.type === 'BUNDLE' ? 'BUNDLE' : 'NORMAL'
                        }))
                    }
                }
            });

            // 4. Record Initial Status Log
            await tx.orderStatusLog.create({
                data: {
                    orderId: order.id,
                    status: 'DIPESAN',
                    message: `Pesanan dibuat via ${input.channel || 'WEBSITE'}`
                }
            });

            // 5. Loyalty Redemption (Atomic)
            if (input.loyaltyPointsUsed && input.loyaltyPointsUsed > 0) {
                const { loyaltyEngine } = await import('@/lib/intelligence/loyaltyEngine');
                const member = await loyaltyEngine.getMemberByPhone(input.brandId, input.customerPhone);
                if (member) {
                    await loyaltyEngine.redeemPoints(
                        member.id,
                        input.loyaltyPointsUsed,
                        `Redemption for Order ${invoiceNo}`
                    );
                }
            }

            return order;
        });
    }

    /**
     * Process payment and finalize transaction
     * This is where Stock Deduction and Accounting happen.
     */
    async processPayment(ctx: ServiceContext, input: ProcessPaymentInput) {
        return unisolatedPrisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: input.orderId },
                include: { orderItems: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Prevent double processing
            if (order.status === 'DIBAYAR' || order.status === 'SELESAI') {
                return order; // Already processed
            }

            // 1. Create payment record if needed
            // (Sometimes payment is created separately, let's ensure it exists)
            await tx.payment.create({
                data: {
                    orderId: input.orderId,
                    amount: input.amount,
                    type: input.method,
                    isVerified: true,
                    verifiedBy: ctx.userId,
                    verifiedAt: new Date()
                }
            });

            // 2. Resolve Warehouse (Default)
            const warehouse = await tx.warehouse.findFirst({
                where: { brandId: order.brandId!, isDefault: true }
            });

            if (!warehouse) {
                throw new Error('Default warehouse not found for brand');
            }

            // 3. Deduct Stock (FIFO) and Calculate HPP
            let totalHpp = 0;
            for (const item of order.orderItems) {
                if (!item.frozenVariantId) continue;

                // Deduct via WarehouseService
                await this.warehouseService.deductStock(
                    ctx,
                    warehouse.id,
                    item.frozenVariantId,
                    item.quantity,
                    order.id,
                    tx
                );

                // Calculate HPP based on current variant cost
                const variant = await tx.frozenVariant.findUnique({
                    where: { id: item.frozenVariantId }
                });
                if (variant) {
                    totalHpp += (Number(variant.costPrice || 0) * item.quantity);
                }
            }

            // 4. Record in Ledger (JournalService)
            const { JournalService } = await import('@/lib/intelligence/journalService');
            const discountAmount = Number(order.subtotal || 0) - Number(order.total || 0);
            const channel = input.channel || order.channel || 'WEBSITE';

            // 4.1 Calculate Fees (MDR / Marketplace)
            const { getPlatformSettingsAction } = await import('@/lib/actions/rasa-ibu/finance');
            const { settings } = await getPlatformSettingsAction(order.brandId!);

            const channelMap: Record<string, string> = {
                'SHOPEE': 'SHOPEE',
                'GRABFOOD': 'GRAB_FOOD',
                'GOFOOD': 'GO_FOOD',
                'TIKTOK': 'TIKTOK_SHOP'
            };

            const configKey = channelMap[channel];
            let platformFeeRate = 0;
            let mdrRate = 0;

            if (configKey && settings) {
                if (settings.marketplaceFees?.[configKey]) {
                    platformFeeRate = Number(settings.marketplaceFees[configKey]);
                }
                if (settings.mdrFees?.[configKey]) {
                    mdrRate = Number(settings.mdrFees[configKey]);
                }
            }

            // Perform core sale recording
            await JournalService.recordSale(
                order.brandId!,
                order.id,
                Number(order.total),
                channel,
                totalHpp,
                Math.max(0, discountAmount)
            );

            // Record Fees if applicable
            const totalAmount = Number(order.total);
            const platformFees = [];

            if (platformFeeRate > 0) {
                const feeAmount = Math.round(totalAmount * (platformFeeRate / 100));
                platformFees.push({
                    amount: feeAmount,
                    accountCode: '5-6000',
                    description: `Marketplace Fee ${channel} (${platformFeeRate}%)`
                });
            }

            if (mdrRate > 0) {
                const mdrAmount = Math.round(totalAmount * (mdrRate / 100));
                platformFees.push({
                    amount: mdrAmount,
                    accountCode: '5-6000',
                    description: `Potongan MDR ${channel} (${mdrRate}%)`
                });
            }

            for (const fee of platformFees) {
                // Determine which account to reduce (Receivable for Marketplaces, Bank for others if any)
                const reductionAccount = ['SHOPEE', 'GRABFOOD', 'GOFOOD', 'TIKTOK'].includes(channel)
                    ? '1-1200' // Reduce Receivable
                    : (channel === 'WEBSITE' ? '1-1100' : '1-1000'); // Bank or Cash

                await JournalService.recordExpense(
                    order.brandId!,
                    fee.amount,
                    fee.accountCode,
                    fee.description,
                    new Date(),
                    reductionAccount
                );
            }

            // 5. Award Loyalty Points
            if (order.customerPhone) {
                try {
                    const { loyaltyEngine } = await import('@/lib/intelligence/loyaltyEngine');
                    await loyaltyEngine.awardPoints(
                        order.brandId!,
                        order.customerPhone,
                        Number(order.total),
                        `Points awarded for Order ${order.invoiceNo}`
                    );
                } catch (loyaltyErr) {
                    console.error('Loyalty award failed:', loyaltyErr);
                }
            }

            // 6. Update Order Status
            const updatedOrder = await tx.order.update({
                where: { id: input.orderId },
                data: {
                    status: 'DIBAYAR'
                }
            });

            // 7. Status Log
            await tx.orderStatusLog.create({
                data: {
                    orderId: order.id,
                    status: 'DIBAYAR',
                    message: `Pembayaran terverifikasi sebesar Rp ${input.amount.toLocaleString('id-ID')}`
                }
            });

            await logSystemActivity('SYSTEM', 'INFO', `Payment Processed: ${order.invoiceNo}`, { orderId: order.id, amount: input.amount }, order.brandId!);

            return updatedOrder;
        });
    }

    /**
     * Cancel order and restore stock if already deducted
     */
    async cancelOrder(ctx: ServiceContext, orderId: string, reason: string) {
        return unisolatedPrisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { orderItems: true }
            });

            if (!order) throw new Error('Order not found');
            if (order.status === 'BATAL') return;

            const wasDeducted = ['DIBAYAR', 'DISIAPKAN', 'DIKIRIM'].includes(order.status);

            // 1. Update status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'BATAL' }
            });

            // 2. Restore stock if needed
            if (wasDeducted) {
                const warehouse = await tx.warehouse.findFirst({
                    where: { brandId: order.brandId!, isDefault: true }
                });

                if (warehouse) {
                    for (const item of order.orderItems) {
                        if (!item.frozenVariantId) continue;

                        // Increment stockOnHand
                        await tx.frozenVariant.update({
                            where: { id: item.frozenVariantId },
                            data: { stockOnHand: { increment: item.quantity } }
                        });

                        // Create reversal mutation
                        const { StockMutationType } = await import('@prisma/client');
                        await tx.stockMutation.create({
                            data: {
                                warehouseId: warehouse.id,
                                variantId: item.frozenVariantId,
                                type: StockMutationType.ADJUSTMENT,
                                quantity: item.quantity,
                                referenceId: orderId,
                                notes: `Order cancelled (${reason}): Stock restored`,
                                createdBy: ctx.userId,
                                brandId: order.brandId!
                            }
                        });
                    }
                }
            }

            // 3. Status Log
            await tx.orderStatusLog.create({
                data: {
                    orderId,
                    status: 'BATAL',
                    message: `Pesanan dibatalkan: ${reason}`
                }
            });

            await logSystemActivity('SYSTEM', 'WARN', `Order Cancelled: ${order.invoiceNo}`, { orderId, reason }, order.brandId!);
        });
    }

    /**
     * Update delivery information and set status to DIKIRIM (Shipped)
     */
    async updateDeliveryInfo(ctx: ServiceContext, orderId: string, info: {
        courierName?: string;
        trackingNo?: string;
        trackingUrl?: string;
        driverName?: string;
        driverPhone?: string;
    }) {
        return unisolatedPrisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'DIKIRIM',
                    courierName: info.courierName,
                    trackingNo: info.trackingNo,
                    trackingUrl: info.trackingUrl,
                    driverName: info.driverName,
                    driverPhone: info.driverPhone,
                    shippedAt: new Date()
                }
            });

            // Status Log
            await tx.orderStatusLog.create({
                data: {
                    orderId,
                    status: 'DIKIRIM',
                    message: `Pesanan dikirim via ${info.courierName || 'Kurir'} ${info.trackingNo ? `(Resi: ${info.trackingNo})` : ''}`
                }
            });

            await logSystemActivity('SYSTEM', 'INFO', `Order Shipped: ${order.invoiceNo}`, { orderId, courier: info.courierName, resi: info.trackingNo }, order.brandId!);

            return order;
        });
    }

    /**
     * Helper to get orders
     */
    async getOrders(brandId: string) {
        return prisma.order.findMany({
            where: { brandId },
            include: {
                orderItems: true,
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
