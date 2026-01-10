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
        const brands = await prisma.brand.findMany({ where: { isActive: true } });
        const results = [];

        for (const brand of brands) {
            const { SubscriptionBillingService } = await import('@/lib/services/SubscriptionBillingService');
            const brandResults = await SubscriptionBillingService.processDueSubscriptions(brand.id);
            results.push({ brand: brand.name, results: brandResults });
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("[SubscriptionCron] Fatal Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
