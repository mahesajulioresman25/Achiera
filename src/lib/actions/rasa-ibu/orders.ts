'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logSystemActivity } from '@/lib/logger';

/**
 * Creates a manual order record.
 * Used by assistants when a customer confirms an order via WhatsApp or Marketplace.
 */
export async function createManualOrder(data: {
    brandId: string;
    customerName: string;
    channel: string;
    items: any[];
    totalAmount: number;
    internalNotes?: string;
    manualRef?: string;
    customerPhone?: string;
    customerEmail?: string;
    warehouseId?: string;
    existingOrderId?: string;
    redeemedPoints?: number;
}) {
    try {
        // Validate stock availability
        for (const item of data.items) {
            const variant = await prisma.frozenVariant.findUnique({
                where: { id: item.variantId, brandId: data.brandId }
            });

            if (!variant) {
                return {
                    success: false,
                    error: `Produk "${item.name}" tidak ditemukan.`
                };
            }

            if (variant.stockOnHand < item.quantity) {
                await logSystemActivity('SYSTEM', 'WARN', `Manual Order Failed: Insufficient Stock for ${item.name}`, { brandId: data.brandId, variantId: item.variantId, currentStock: variant.stockOnHand, requested: item.quantity }, data.brandId);
                return {
                    success: false,
                    error: `Stok "${item.name}" tidak mencukupi. Tersedia: ${variant.stockOnHand}, Diminta: ${item.quantity}`
                };
            }
        }

        // Since OrderItem table doesn't exist, we'll store item info in internalNotes
        const itemsSummary = data.items.map(item =>
            `${item.name} x${item.quantity} @ Rp${item.price.toLocaleString('id-ID')}`
        ).join(', ');

        const fullNotes = data.internalNotes
            ? `${data.internalNotes}\n\nItems: ${itemsSummary}`
            : `Items: ${itemsSummary}`;

        // 2. Resolve Warehouse
        let warehouseId = data.warehouseId;
        if (!warehouseId && data.brandId) {
            const defaultWarehouse = await prisma.warehouse.findFirst({
                where: { brandId: data.brandId, isDefault: true }
            });
            warehouseId = defaultWarehouse?.id;
        }

        // 2.5 Calculate Loyalty Discount and Redeem Points
        let discountValue = 0;
        if (data.redeemedPoints && data.redeemedPoints > 0) {
            const { getPlatformSettingsAction } = await import('@/lib/actions/rasa-ibu/finance');
            const settingsRes = await getPlatformSettingsAction(data.brandId);
            const pointValue = settingsRes.success ? (settingsRes.settings?.loyalty?.pointValueInRupiah || 100) : 100;
            discountValue = data.redeemedPoints * pointValue;

            // Actually redeem the points
            try {
                const { loyaltyEngine } = await import('@/lib/intelligence/loyaltyEngine');
                if (data.customerPhone) {
                    const member = await loyaltyEngine.getMemberByPhone(data.brandId, data.customerPhone);
                    if (member) {
                        await loyaltyEngine.redeemPoints(member.id, data.redeemedPoints, `Order #${data.manualRef || 'Manual'}`);
                    } else {
                        console.warn(`Loyalty member not found for phone: ${data.customerPhone}. Points not redeemed.`);
                    }
                } else {
                    console.warn('Customer phone not provided. Cannot redeem loyalty points.');
                }
            } catch (redeemErr) {
                console.error('Failed to redeem points during order creation:', redeemErr);
            }
        }

        if (!warehouseId) {
            return {
                success: false,
                error: 'Gudang tidak ditemukan. Pastikan gudang default telah diset.'
            };
        }

        // 3. Create OR Update order
        let order;

        // Check if we are linking to an existing Skeleton Order
        const existingOrderId = data.existingOrderId;
        if (existingOrderId) {
            // MERGE Logic
            order = await unisolatedPrisma.order.update({
                where: { id: existingOrderId },
                data: {
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    customerEmail: data.customerEmail,
                    internalNotes: fullNotes, // Overwrites [AUTO_GENERATED] note
                    quantity: data.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
                    subtotal: data.totalAmount + discountValue, // Gross amount before discount
                    total: data.totalAmount, // Net amount after discount

                    // Link items
                    orderItems: {
                        create: data.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                            frozenVariantId: item.variantId
                        }))
                    }
                }
            });
        } else {
            // CREATE Logic
            order = await prisma.order.create({
                data: {
                    brandId: data.brandId,
                    brand: { connect: { id: data.brandId } },
                    invoiceNo: `INV-${Date.now()}`,
                    quantity: data.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
                    subtotal: data.totalAmount + discountValue, // Gross amount before discount
                    total: data.totalAmount, // Net amount after discount
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    customerEmail: data.customerEmail,
                    channel: data.channel || 'WHATSAPP',
                    internalNotes: fullNotes,
                    status: ['SHOPEE', 'GRABFOOD', 'GOFOOD'].includes(data.channel) ? 'COMPLETED' : 'DIPESAN',
                    manualRef: data.manualRef || `RI-${Math.floor(1000 + Math.random() * 9000)}`,
                    warehouse: { connect: { id: warehouseId } },
                    orderItems: {
                        create: data.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                            frozenVariantId: item.variantId
                        }))
                    }
                } as any,
            });
        }

        // 4. Deduct stock using FIFO logic
        const { WarehouseService } = await import('@/lib/services/WarehouseService');
        const warehouseService = new WarehouseService();
        const ctx = { brandId: data.brandId, userId: 'MANUAL_OPERATOR' };

        for (const item of data.items) {
            await warehouseService.deductStock(
                ctx,
                warehouseId,
                item.variantId,
                item.quantity,
                order.id
            );

            // 🚨 LOW STOCK ALERT (Optimization)
            const updatedVariant = await prisma.frozenVariant.findUnique({
                where: { id: item.variantId, brandId: data.brandId },
                include: { product: true }
            });

            if (updatedVariant && updatedVariant.stockOnHand < 10) {
                try {
                    const { EmailService } = await import('@/lib/services/EmailService');
                    const alertMsg = `Produk: ${updatedVariant.product.name}\nVarian: ${updatedVariant.name}\nStok Sisa: ${updatedVariant.stockOnHand}\n\nSegera lakukan produksi atau restock!`;

                    await EmailService.sendAdminAlert(`STOK MENIPIS: ${updatedVariant.product.name}`, alertMsg);

                    // Create StockAlert record in DB
                    await prisma.stockAlert.create({
                        data: {
                            brandId: data.brandId || '',
                            variantId: item.variantId,
                            alertType: 'LOW_STOCK',
                            severity: updatedVariant.stockOnHand <= 3 ? 'CRITICAL' : 'WARNING',
                            currentStock: updatedVariant.stockOnHand,
                            recommendedAction: 'Restock immediately',
                            status: 'OPEN'
                        }
                    });
                    console.log(`📡 Low stock alert sent for ${updatedVariant.product.name}`);
                } catch (alertErr) {
                    console.error('Failed to send low stock alert:', alertErr);
                }
            }
        }

        // 📱 SEND EMAIL NOTIFICATION
        if (order.customerEmail) {
            try {
                const { EmailService } = await import('@/lib/services/EmailService');
                await EmailService.sendOrderConfirmation(order as any);
            } catch (emailError) {
                console.error('Email notification error (non-critical):', emailError);
            }
        }

        revalidatePath(`/dashboard/rasa-ibu`);

        // Success Log
        await logSystemActivity('SYSTEM', 'INFO', `Manual Order Created: ${order.invoiceNo}`, { orderId: order.id, total: data.totalAmount, channel: data.channel }, data.brandId);

        return { success: true, data: JSON.parse(JSON.stringify(order)) };
    } catch (error: any) {
        console.error('Create Order Error:', error);
        await logSystemActivity('SYSTEM', 'ERROR', `Create Manual Order Failed`, { error: error.message, stack: error.stack }, data.brandId);
        return {
            success: false,
            error: error.message || 'Gagal menyimpan pesanan. Silakan coba lagi.'
        };
    }
}

/**
 * Updates the status of an existing order.
 * Transitions through: DIPESAN -> DIBAYAR -> DISIAPKAN -> DIKIRIM -> SELESAI
 */
export async function updateOrderStatus(
    orderId: string,
    status: string,
    deliveryData?: {
        courierName?: string;
        trackingNo?: string;
        trackingUrl?: string;
        driverName?: string;
        driverPhone?: string;
    }
) {
    try {
        // Special case: If status is DIKIRIM and deliveryData is provided, use OrderService
        if (status === 'DIKIRIM' && deliveryData) {
            const orderBefore = await unisolatedPrisma.order.findUnique({ where: { id: orderId } });
            if (!orderBefore?.brandId) throw new Error('Order or Brand not found');

            const { OrderService } = await import('@/lib/services/OrderService');
            const orderService = new OrderService();
            const ctx = { brandId: orderBefore.brandId, userId: 'ADMIN_SYSTEM' };

            const order = await orderService.updateDeliveryInfo(ctx, orderId, deliveryData);

            // 📱 SEND PUBLIC STATUS UPDATE EMAIL (With Tracking Info)
            if (order.customerEmail) {
                try {
                    const { EmailService } = await import('@/lib/services/EmailService');
                    await EmailService.sendStatusUpdate(order as any, status);
                } catch (emailErr) {
                    console.error('Failed to send status update email:', emailErr);
                }
            }

            // 💬 SEND WHATSAPP NOTIFICATION (Non-blocking)
            if (order.customerPhone) {
                try {
                    const { quikWAService } = await import('@/lib/services/QuikWAService');
                    await quikWAService.sendShippingNotification({
                        invoiceNo: order.invoiceNo,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        courierName: deliveryData.courierName,
                        trackingNo: deliveryData.trackingNo,
                        trackingUrl: deliveryData.trackingUrl,
                        driverName: deliveryData.driverName,
                        brandId: order.brandId || undefined
                    });
                } catch (waErr) {
                    console.error('Failed to send WhatsApp notification:', waErr);
                }
            }

            revalidatePath(`/dashboard/rasa-ibu`);
            return { success: true, data: JSON.parse(JSON.stringify(order)) };
        }

        const order = await unisolatedPrisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
        });

        // 💰 PROCESS PAYMENT & ACCOUNTING via OrderService
        if (status === 'DIBAYAR' && order.brandId) {
            try {
                const { OrderService } = await import('@/lib/services/OrderService');
                const orderService = new OrderService();
                const ctx = { brandId: order.brandId, userId: 'ADMIN_SYSTEM' };

                await orderService.processPayment(ctx, {
                    orderId,
                    amount: Number(order.totalAmount || order.total),
                    method: order.paymentMethod || 'MANUAL',
                    channel: order.channel || 'OFFLINE'
                });

                console.log(`✅ Order ${orderId} finalized via OrderService.processPayment`);
            } catch (payError) {
                console.error('Unified Payment Processing Failed:', payError);
            }
        }

        // 📱 SEND PUBLIC STATUS UPDATE EMAIL
        if (order.customerEmail) {
            try {
                const { EmailService } = await import('@/lib/services/EmailService');
                await EmailService.sendStatusUpdate(order as any, status);
            } catch (emailErr) {
                console.error('Failed to send status update email:', emailErr);
            }
        }

        // 💬 SEND WHATSAPP NOTIFICATION (Non-blocking)
        if (order.customerPhone) {
            try {
                const { quikWAService } = await import('@/lib/services/QuikWAService');

                // Send appropriate notification based on status
                if (status === 'DIBAYAR') {
                    await quikWAService.sendPaymentConfirmation({
                        invoiceNo: order.invoiceNo,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        totalAmount: Number(order.totalAmount || order.total),
                        brandId: order.brandId || undefined
                    });
                } else if (status === 'SELESAI') {
                    await quikWAService.sendDeliveryCompleted({
                        invoiceNo: order.invoiceNo,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        brandId: order.brandId || undefined
                    });
                }
            } catch (waErr) {
                console.error('Failed to send WhatsApp notification:', waErr);
            }
        }

        revalidatePath(`/dashboard/rasa-ibu`);
        return { success: true, data: JSON.parse(JSON.stringify(order)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Auto-Generated Orders (Skeleton Orders)
 * Used to link manual input to settlement reconciliation.
 */
export async function getUnlinkedAutoOrdersAction(brandId: string, channel: string) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                channel,
                internalNotes: {
                    contains: '[AUTO_GENERATED]'
                },
                status: 'SELESAI' // Only fetch completed skeleton orders (reconciled ones)
            },
            select: {
                id: true,
                externalOrderId: true,
                total: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Parse result
        const formatted = orders.map((o: any) => ({
            id: o.id,
            externalOrderId: o.externalOrderId,
            total: Number(o.total),
            date: o.createdAt
        }));

        return { success: true, data: formatted };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
