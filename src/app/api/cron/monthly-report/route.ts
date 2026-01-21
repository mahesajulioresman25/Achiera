
import { NextResponse } from 'next/server';
import { MonthlyReportService } from '@/lib/services/MonthlyReportService';
import { analyzeMonthlyData } from '@/lib/ai/monthly-report-analyzer';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { prisma } from '@/lib/prisma';
import { logSystemActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Optional: Check for Cron Secret if needed
        // const auth = request.headers.get('authorization');
        // if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const brands = await prisma.brand.findMany({ where: { isActive: true } });
        const reportService = new MonthlyReportService();
        const notificationService = new ReportNotificationService();

        const results = [];

        for (const brand of brands) {
            try {
                // 1. Collect Data
                const data = await reportService.collectMonthlyData(brand.id);

                // 2. AI Analysis
                const analysis = await analyzeMonthlyData(data);

                // 3. Send Notification
                await notificationService.sendMonthlyReport(brand.id, data, analysis);

                await logSystemActivity(
                    'EMAIL_SEND',
                    'INFO',
                    `Monthly Report sent for ${brand.name}`,
                    { month: data.period.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) },
                    brand.id
                );

                results.push({ brand: brand.name, status: 'sent' });
            } catch (error) {
                console.error(`Failed to generate report for ${brand.name}:`, error);

                await logSystemActivity(
                    'EMAIL_SEND',
                    'ERROR',
                    `Failed to send Monthly Report for ${brand.name}`,
                    { error: String(error) },
                    brand.id
                );

                results.push({ brand: brand.name, status: 'failed', error: String(error) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
