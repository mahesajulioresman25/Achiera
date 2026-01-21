
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MonthlyReportService } from '@/lib/services/MonthlyReportService';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { logSystemActivity } from '@/lib/logger';

export async function GET(req: Request) {
    try {
        const reportService = new MonthlyReportService();
        const notificationService = new ReportNotificationService();

        // 1. Find all active brands (or just Rasa Ibu)
        const brands = await prisma.brand.findMany({
            where: { isActive: true }
        });

        const results = [];

        for (const brand of brands) {
            // Only for Rasa Ibu as per recent user filter request
            if (brand.name === 'Rasa Ibu') {
                // 2. Generate Weekly Trends
                const data = await reportService.getWeeklyTrends(brand.id);

                // 3. Send via WhatsApp / Email
                await notificationService.sendWeeklyTrend(brand.id, data);

                await logSystemActivity(
                    'EMAIL_SEND',
                    'INFO',
                    `Weekly Trend sent for ${brand.name}`,
                    { totalOrders: data.totalOrders, growth: data.growth },
                    brand.id
                );

                results.push({
                    brand: brand.name,
                    status: 'Weekly Trend Sent'
                });
            }
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (error: any) {
        console.error('[Weekly Trend Cron] Error:', error);

        // Log generic error if we can identify brand or just mark as system error
        await logSystemActivity(
            'EMAIL_SEND',
            'ERROR',
            `Global failure in Weekly Trend Cron`,
            { error: error.message }
        );

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
