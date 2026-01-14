import { NextRequest, NextResponse } from 'next/server';
import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { JournalService } from '@/lib/intelligence/journalService';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string; id: string }> }
) {
    try {
        const { id, brandId } = await params;
        const body = await req.json();
        const { status, deliveryDays } = body;

        // 1. Fetch current subscription to check previous status and get value
        const currentSub = await prisma.subscription.findFirst({
            where: { id, brandId },
            include: {
                plan: true,
                items: { include: { variant: true } }
            }
        });

        if (!currentSub) {
            return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
        }

        // 2. Update Subscription (Using unisolated because we verified brand access above)
        const updated = await unisolatedPrisma.subscription.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(deliveryDays && { deliveryDays })
            }
        });

        // 3. If Status Changed to ACTIVE -> Record Revenue & Deduct Stock
        if (status === 'ACTIVE' && currentSub.status !== 'ACTIVE') {
            try {
                // A. RECORD REVENUE
                // Calculate Subscription Value
                let amount = 0;
                if (currentSub.plan) {
                    amount = Number(currentSub.plan.price || 0);
                } else {
                    amount = currentSub.items.reduce((sum, item) => sum + (Number(item.variant?.price || 0) * item.quantity), 0);
                }

                if (amount > 0) {
                    await JournalService.recordIncome(
                        brandId,
                        amount,
                        '4-1000', // Pendapatan Makanan (Default) - or create 4-1002 for Subscriptions
                        `Pendapatan Langganan #${currentSub.id.substring(0, 8)} - ${currentSub.customerName}`,
                        '1-1100', // Bank BCA (Default Asset)
                        new Date()
                    );
                    console.log(`[Subscription Revenue] Recorded Rp ${amount} for ${currentSub.id}`);
                }

                // B. DEDUCT STOCK (Create first delivery)
                const { SubscriptionDeliveryService } = await import('@/lib/services/SubscriptionDeliveryService');
                const nextDeliveryDate = SubscriptionDeliveryService.getNextDeliveryDate(currentSub.deliveryDays);

                console.log(`[Subscription Activation] Scheduling first delivery for ${nextDeliveryDate.toISOString().split('T')[0]}`);

                await SubscriptionDeliveryService.createDeliveryAndDeductStock(currentSub, nextDeliveryDate);

            } catch (err) {
                console.error("[Subscription Activation] Failed to record ledger or deduct stock:", err);
                // Don't fail the request, just log error
            }
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
