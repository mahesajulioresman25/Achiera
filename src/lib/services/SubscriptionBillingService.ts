import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';

export class SubscriptionBillingService {
    /**
     * Finds and processes all active subscriptions due for renewal for a specific brand.
     * 1. Creates a new Order (status: MENUNGGU_PEMBAYARAN)
     * 2. Sends an Invoice Email via EmailService
     * 3. Updates nextPaymentDate on the Subscription
     */
    static async processDueSubscriptions(brandId: string) {
        const today = new Date();
        const results = [];

        const dueSubscriptions = await prisma.subscription.findMany({
            where: {
                brandId,
                status: 'ACTIVE',
                nextPaymentDate: { lte: today }
            },
            include: {
                items: { include: { variant: true } }
            }
        });

        console.log(`[SubscriptionBillingService] Found ${dueSubscriptions.length} due subscriptions for brand ${brandId}.`);

        for (const sub of dueSubscriptions) {
            try {
                // Calculate Totals
                let totalAmount = 0;
                const orderItems = sub.items.map(item => {
                    const price = item.variant.price;
                    const subtotal = Number(price) * item.quantity;
                    totalAmount += subtotal;
                    return {
                        name: item.variant.name,
                        quantity: item.quantity,
                        price: price,
                        subtotal: subtotal,
                        variantId: item.variantId
                    };
                });

                // Generate Invoice Number
                const invoiceNo = `SUB-${sub.id.substring(0, 4).toUpperCase()}-${Date.now().toString().substring(6)}`;

                // Create Order
                const order = await prisma.order.create({
                    data: {
                        brandId: sub.brandId,
                        invoiceNo: invoiceNo,
                        customerName: sub.customerName,
                        customerEmail: sub.customerEmail,
                        customerPhone: sub.customerPhone,
                        customerAddress: sub.customerAddress,
                        quantity: sub.items.reduce((acc, i) => acc + i.quantity, 0),
                        subtotal: totalAmount,
                        total: totalAmount,
                        status: 'MENUNGGU_PEMBAYARAN',
                        channel: 'SUBSCRIPTION',
                        orderItems: {
                            create: orderItems
                        }
                    }
                });

                // Send Billing Email
                if (sub.customerEmail) {
                    await EmailService.sendOrderConfirmation({
                        invoiceNo: order.invoiceNo,
                        customerName: order.customerName,
                        customerEmail: order.customerEmail!,
                        total: Number(order.total),
                        status: order.status,
                        items: orderItems,
                        brandId: sub.brandId,
                        paymentMethod: 'TRANSFER'
                    });
                }

                // Update Next Payment Date
                const nextDate = new Date(sub.nextPaymentDate);
                if (sub.interval === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }

                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: {
                        nextPaymentDate: nextDate,
                        lastOrderDate: new Date()
                    }
                });

                results.push({ subscriptionId: sub.id, orderId: order.id, status: 'SUCCESS' });

            } catch (err) {
                console.error(`[SubscriptionBillingService] Error for sub ${sub.id}:`, err);
                results.push({ subscriptionId: sub.id, status: 'FAILED', error: String(err) });
            }
        }

        return results;
    }
}
