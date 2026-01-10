import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/EmailService';

/**
 * Subscription Billing Cron
 * Runs daily to find subscriptions due for renewal.
 * 1. Creates Order (WAITING_PAYMENT)
 * 2. Sends Invoice Email
 * 3. Updates Subscription.nextPaymentDate
 */
export async function GET(req: NextRequest) {
    try {
        const today = new Date();

        // 1. Find due subscriptions
        const dueSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
                nextPaymentDate: { lte: today }
            },
            include: {
                items: { include: { variant: true } },
                user: true
            }
        });

        console.log(`[SubscriptionCron] Found ${dueSubscriptions.length} due subscriptions.`);

        const results = [];

        for (const sub of dueSubscriptions) {
            try {
                // Calculate Totals
                let totalAmount = 0;
                const orderItems = sub.items.map(item => {
                    const price = item.variant.price; // Use current price
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
                        total: totalAmount, // Tax logic can be added here
                        status: 'MENUNGGU_PEMBAYARAN', // Custom status for Subscription Pending
                        channel: 'SUBSCRIPTION',
                        orderItems: {
                            create: orderItems
                        }
                    }
                });

                // Send Email
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

                results.push({ subscriptionId: sub.id, orderId: order.id, status: 'PROCESSED' });

            } catch (err) {
                console.error(`[SubscriptionCron] Error processing sub ${sub.id}:`, err);
                results.push({ subscriptionId: sub.id, error: (err as Error).message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });

    } catch (error) {
        console.error("[SubscriptionCron] Fatal Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
