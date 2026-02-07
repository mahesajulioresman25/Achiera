'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logSystemActivity } from '@/lib/logger';

export async function createWebsiteOrderAction(data: {
    brandId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress: string;
    items: any[];
    totalAmount: number;
    customerNote?: string;
    redeemedPoints?: number;
    deliveryOption?: string;
    courierType?: string;
    paymentMethod?: string;
    isGift?: boolean;
    giftMessage?: string;
    recipientName?: string;
    recipientEmail?: string;
    isMarketingAllowed?: boolean;
    voucherCode?: string;
}) {
    try {
        let brandId = data.brandId;

        // Resolve Brand ID if slug is provided
        if (brandId === 'rasa-ibu' || !brandId.startsWith('c')) {
            const brand = await prisma.brand.findUnique({
                where: { slug: brandId },
                select: { id: true }
            });
            if (brand) brandId = brand.id;
        }

        // 1. Resolve Warehouse
        const warehouse = await prisma.warehouse.findFirst({
            where: { brandId: brandId, isDefault: true }
        });
        if (!warehouse) {
            return {
                success: false,
                error: 'Sistem sedang pemeliharaan stok (Gudang tidak ditemukan).'
            };
        }

        // 2. Validate stock availability and Recalculate Subtotal based on DB prices
        const { WarehouseService } = await import('@/lib/services/WarehouseService');
        const warehouseService = new WarehouseService();
        let serverSubtotal = 0;

        for (const item of data.items) {
            // Fallback for old/default variant IDs
            if (item.variantId === 'default' && item.productId) {
                const product = await prisma.frozenProduct.findFirst({
                    where: { id: item.productId, brandId: brandId },
                    include: { variants: { take: 1 } }
                });
                if (product?.variants[0]) {
                    item.variantId = product.variants[0].id;
                }
            }

            // Fetch current DB price for security
            const variant = await prisma.frozenVariant.findFirst({
                where: { id: item.variantId, brandId },
                select: { price: true, name: true }
            });

            if (!variant) {
                return { success: false, error: `Produk "${item.name}" tidak ditemukan.` };
            }

            // Update item price with DB price for downstream consistency
            item.price = Number(variant.price);
            serverSubtotal += item.price * Number(item.quantity);

            const currentStock = await warehouseService.getStockLevel(brandId, warehouse.id, item.variantId);

            if (currentStock < item.quantity) {
                await logSystemActivity('SYSTEM', 'WARN', `Create Order Failed: Insufficient Stock for ${item.name}`, { brandId, variantId: item.variantId, currentStock, requested: item.quantity }, brandId);
                return {
                    success: false,
                    error: `Stok "${item.name}" saat ini tidak tersedia di gudang pengiriman.`
                };
            }
        }

        // 3. Handle Loyalty Redemption if applicable (Brand Specific)
        let discount = 0;
        let redemptionNote = '';
        if (data.redeemedPoints && data.redeemedPoints > 0) {
            const { loyaltyEngine } = await import('../../intelligence/loyaltyEngine');
            const member = await loyaltyEngine.getMemberByPhone(brandId, data.customerPhone || '');
            const localBalance = member?.availablePoints || 0;

            if (localBalance < data.redeemedPoints) {
                return {
                    success: false,
                    error: `Poin tidak mencukupi untuk brand ini. Tersedia: ${localBalance} poin.`
                };
            }

            // Fetch dynamic conversion value
            const { getPlatformSettingsAction } = await import('../rasa-ibu/finance');
            const settingsRes = await getPlatformSettingsAction(brandId);
            const pointValue = settingsRes.success ? (settingsRes.settings?.loyalty?.pointValueInRupiah || 100) : 1000;

            // Conversion: 1 Point = Rp {pointValue}
            discount = data.redeemedPoints * pointValue;
            redemptionNote = `\nRedeemed ${data.redeemedPoints} points from brand-specific record for Rp ${discount.toLocaleString('id-ID')} discount.`;

            // Deduct points from local brand
            if (member) {
                await loyaltyEngine.redeemPoints(
                    member.id,
                    data.redeemedPoints,
                    `Website Checkout Redemption`
                );
            }
        }

        // 3.5 Check Flash Sale
        let flashSaleDiscount = 0;
        let flashSaleNote = '';
        try {
            const { FlashSaleService } = await import('../../services/FlashSaleService');
            const activeFlashSale = await FlashSaleService.getActiveFlashSale(brandId);

            if (activeFlashSale) {
                const discountableAmount = serverSubtotal;
                flashSaleDiscount = FlashSaleService.calculateDiscount(discountableAmount, activeFlashSale, data.items);
                if (flashSaleDiscount > 0) {
                    flashSaleNote = `FLASH SALE: ${activeFlashSale.name} (${activeFlashSale.discountPercentage}%) -Rp ${flashSaleDiscount.toLocaleString('id-ID')}`;
                }
            }
        } catch (err) {
            console.error("Flash Sale Check Failed:", err);
        }

        // 4. Create the order via OrderService
        const { OrderService } = await import('@/lib/services/OrderService');
        const orderService = new OrderService();

        const ctx: any = { brandId: brandId, userId: 'WEBSITE_VISITOR' };
        const combinedInternalNote = `Website Order. ${redemptionNote} ${flashSaleNote}`.trim();

        const order = await orderService.createOrder(ctx, {
            brandId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            customerAddress: data.customerAddress,
            customerNote: `[${data.deliveryOption || 'PENGAMBILAN'}${data.courierType ? ` - ${data.courierType}` : ''}] ${data.customerNote || ''}`.trim(),
            items: data.items.map(item => ({
                variantId: item.variantId,
                name: item.name,
                variantName: item.variantName || '',
                quantity: Number(item.quantity),
                price: Number(item.price),
                note: item.note,
                productBundleId: item.productBundleId,
                type: item.type === 'BUNDLE' ? 'BUNDLE' : 'NORMAL'
            })),
            channel: 'WEBSITE',
            paymentMethod: data.paymentMethod,
            loyaltyPointsUsed: data.redeemedPoints,
            deliveryOption: data.deliveryOption,
            courierType: data.courierType,
            isGift: data.isGift,
            giftMessage: data.giftMessage,
            recipientName: data.recipientName,
            recipientEmail: data.recipientEmail,
            internalNotes: combinedInternalNote,
            voucherCode: data.voucherCode
        });

        // 4.5 Sync Marketing Preference (LoyaltyAccount)
        try {
            // Update LoyaltyAccount (used by legacy components)
            await prisma.loyaltyAccount.upsert({
                where: {
                    brandId_customerPhone: {
                        brandId,
                        customerPhone: data.customerPhone
                    }
                },
                update: {
                    isMarketingAllowed: data.isMarketingAllowed !== undefined ? data.isMarketingAllowed : true,
                    customerName: data.customerName
                },
                create: {
                    brandId,
                    customerPhone: data.customerPhone,
                    customerName: data.customerName,
                    isMarketingAllowed: data.isMarketingAllowed !== undefined ? data.isMarketingAllowed : true,
                    balance: 0,
                    lifetimeEarned: 0
                }
            } as any);
        } catch (loyaltyError) {
            console.error('Loyalty sync error (non-critical):', loyaltyError);
        }

        // 5. Send Notifications (Email & WhatsApp)
        try {
            const { EmailService } = await import('@/lib/services/EmailService');
            const { WhatsAppService } = await import('@/lib/services/WhatsAppService');

            // WhatsApp Notification (Non-blocking)
            if (data.customerPhone) {
                // Fetch loyalty info if any to include in message
                let loyaltyInfo = undefined;
                if (data.redeemedPoints) {
                    // This is just a simple check, actual points earned might need loyaltyEngine calculation
                    // But for the confirmation message, we can just say "Pesanan diterima"
                }

                await WhatsAppService.sendOrderCreated(order);
            }

            if (data.customerEmail) {
                await EmailService.sendOrderConfirmation({
                    ...order,
                    paymentMethod: data.paymentMethod,
                    brandId: order.brandId || undefined
                } as any);

                // Send Gift Notification if applicable
                if (data.isGift && data.recipientEmail) {
                    await EmailService.sendGiftNotification({
                        ...order,
                        giftMessage: data.giftMessage,
                        recipientName: data.recipientName,
                        recipientEmail: data.recipientEmail,
                        customerName: data.customerName, // Sender
                        brandId: order.brandId || undefined
                    } as any);
                }
            }
        } catch (notifError) {
            console.error('Notification error (non-critical):', notifError);
        }

        revalidatePath('/dashboard/rasa-ibu');

        // Success Log
        await logSystemActivity('SYSTEM', 'INFO', `Website Order Created: ${order.invoiceNo}`, { orderId: order.id, total: order.total }, brandId);

        return {
            success: true,
            orderId: order.id,
            invoiceNo: order.invoiceNo
        };
    } catch (error: any) {
        console.error('Create Website Order Error:', error);
        await logSystemActivity('SYSTEM', 'ERROR', `Create Website Order Failed`, { error: error.message, stack: error.stack }, data.brandId);
        return {
            success: false,
            error: error.message || 'Gagal menyimpan pesanan. Silakan coba lagi.'
        };
    }
}

/**
 * Get user's order history
 */
export async function getUserOrdersAction(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user?.email) {
            return [];
        }

        const orders = await unisolatedPrisma.order.findMany({
            where: {
                customerEmail: user.email
            },
            include: {
                orderItems: {
                    include: {
                        frozenVariant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                brand: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to last 50 orders
        });

        return orders;
    } catch (error) {
        console.error('[getUserOrdersAction] Error:', error);
        return [];
    }
}

/**
 * Get customer's previous order data by name for autofill
 */
export async function getCustomerDataByNameAction(name: string) {
    try {
        // Find the most recent successful order with this customer name
        const order = await unisolatedPrisma.order.findFirst({
            where: {
                customerName: {
                    contains: name,
                    mode: 'insensitive'
                },
                status: {
                    in: ['LUNAS', 'DIKIRIM', 'SELESAI'] // Only successful orders
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                customerAddress: true
            }
        });

        return order;
    } catch (error) {
        console.error('[getCustomerDataByNameAction] Error:', error);
        return null;
    }
}
