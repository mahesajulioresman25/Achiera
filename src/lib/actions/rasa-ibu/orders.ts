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
export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const order = await unisolatedPrisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
        });

        // Create journal entry when order is paid
        if (status === 'DIBAYAR' && order.brandId) {
            try {
                const { JournalService } = await import('@/lib/intelligence/journalService');
                const { initializeChartOfAccounts, getAccountByCode } = await import('@/lib/intelligence/chartOfAccounts');

                // Ensure CoA exists
                const cashAccount = await getAccountByCode(order.brandId, '1-1000');
                if (!cashAccount) {
                    await initializeChartOfAccounts(order.brandId);
                }

                // Calculate HPP
                const orderWithItems = await unisolatedPrisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        orderItems: {
                            include: {
                                frozenVariant: true
                            }
                        }
                    }
                });

                let totalHPP = 0;
                if (orderWithItems) {
                    for (const oItem of orderWithItems.orderItems) {
                        const cost = Number(oItem.frozenVariant?.costPrice || 0);
                        totalHPP += cost * oItem.quantity;
                    }
                }

                // Ensure HPP account exists
                await prisma.ledgerAccount.upsert({
                    where: { brandId_code: { brandId: order.brandId, code: '5-1000' } },
                    update: {},
                    create: { brandId: order.brandId, code: '5-1000', name: 'Harga Pokok Penjualan (HPP)', type: 'EXPENSE' }
                });

                // Get Platform Settings for MDR
                const { getPlatformSettingsAction } = await import('@/lib/actions/rasa-ibu/finance');
                const { settings } = await getPlatformSettingsAction(order.brandId);

                const channel = order.channel || 'OFFLINE';

                // Map channel to config key
                const channelMap: Record<string, string> = {
                    'SHOPEE': 'SHOPEE',
                    'GRABFOOD': 'GRAB_FOOD',
                    'GOFOOD': 'GO_FOOD',
                    'TIKTOK': 'TIKTOK_SHOP'
                };

                const configKey = channelMap[channel];
                let platformFeeRate = 0;
                let mdrRate = 0;

                if (configKey) {
                    if (settings?.marketplaceFees?.[configKey]) {
                        platformFeeRate = Number(settings.marketplaceFees[configKey]);
                    }
                    if (settings?.mdrFees?.[configKey]) {
                        mdrRate = Number(settings.mdrFees[configKey]);
                    }
                }

                const totalAmount = Number(order.totalAmount || order.total);
                const discountAmount = Number(order.subtotal || 0) - Number(order.total || 0);

                const platformFees = [];

                if (platformFeeRate > 0) {
                    const feeAmount = Math.round(totalAmount * (platformFeeRate / 100));
                    platformFees.push({
                        amount: feeAmount,
                        accountCode: '5-6000', // Biaya Komisi/Marketplace
                        description: `Marketplace Fee ${channel} (${platformFeeRate}%)`
                    });
                }

                if (mdrRate > 0) {
                    const mdrAmount = Math.round(totalAmount * (mdrRate / 100));
                    platformFees.push({
                        amount: mdrAmount,
                        accountCode: '5-6000', // Biaya Adm Bank
                        description: `Potongan MDR ${channel} (${mdrRate}%)`
                    });
                }

                // If Paid, we assume it hits the Bank/Cash
                // However, recordSale typically records Receivable for Marketplaces
                if (['SHOPEE', 'GRABFOOD', 'GOFOOD', 'TIKTOK'].includes(channel)) {
                    // Option A: Dr Receivable (Full), Dr Expense (Fees), Cr Sales (Gross)
                    await JournalService.recordSale(
                        order.brandId,
                        orderId,
                        totalAmount,
                        channel,
                        totalHPP,
                        Math.max(0, discountAmount)
                    );

                    // Record each fee as a reduction of receivable
                    for (const fee of platformFees) {
                        await JournalService.recordExpense(
                            order.brandId,
                            fee.amount,
                            fee.accountCode,
                            fee.description,
                            new Date(),
                            '1-1200' // Reduce Receivable
                        );
                    }
                } else {
                    // Direct Cash/Transfer (Offline/Whatsapp)
                    // Net Amount hits the bank/cash immediately
                    await JournalService.recordSale(
                        order.brandId,
                        orderId,
                        totalAmount,
                        channel,
                        totalHPP,
                        Math.max(0, discountAmount)
                    );
                    // For manual transfer/QRIS, if there is MDR, we should record expense and reduce cash?
                    // But JournalService.recordSale uses 1-1000/1-1100.
                }
                // Award Loyalty Points after successful transition to DIBAYAR
                if (order.customerPhone) {
                    try {
                        const { processOrderLoyalty } = await import('./businessIntelligence');
                        await processOrderLoyalty(
                            order.brandId,
                            order.customerPhone,
                            order.customerName || 'Bunda',
                            totalAmount,
                            orderId
                        );
                        console.log(`✅ Loyalty points awarded via updateOrderStatus for order ${orderId}`);
                    } catch (loyaltyError) {
                        console.error('Loyalty points error in updateOrderStatus:', loyaltyError);
                    }
                }
            } catch (jeError) {
                console.error('Failed to create journal entry:', jeError);
                // Don't fail the order update if JE fails, checking availability next time
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
