import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionDeliveryService } from '@/lib/services/SubscriptionDeliveryService';

export async function GET(req: NextRequest) {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Cron] Unauthorized access attempt to process-deliveries endpoint');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting daily delivery processing...');
        const results = await SubscriptionDeliveryService.processDailyDeliveries();

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log(`[Cron] Delivery processing complete: ${successCount} successful, ${failureCount} failed`);

        return NextResponse.json({
            success: true,
            message: 'Deliveries processed',
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            },
            results
        });
    } catch (error: any) {
        console.error('[Cron] Fatal error processing deliveries:', error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
