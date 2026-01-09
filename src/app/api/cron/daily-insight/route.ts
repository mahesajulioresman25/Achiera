
import { NextResponse } from 'next/server';
import { DailyInsightsService } from '@/lib/services/DailyInsightsService';
import { generateDailyInsights } from '@/lib/ai/daily-insights-generator';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const brands = await prisma.brand.findMany({ where: { isActive: true } });
        const dataService = new DailyInsightsService();
        const notificationService = new ReportNotificationService();

        const results = [];

        for (const brand of brands) {
            try {
                // 1. Collect Daily Data
                const data = await dataService.collectDailyData(brand.id);

                // 2. Detect Anomalies (Logic based)
                const anomalies = dataService.detectAnomalies(data);

                // 3. AI Analysis (Claude)
                // Always generate insight, but notification service handles severity filtering
                const analysis = await generateDailyInsights(data, anomalies);

                // 4. Send Alert (Logic inside service checks severity)
                await notificationService.sendDailyInsight(brand.id, analysis, data);

                results.push({
                    brand: brand.name,
                    status: 'processed',
                    severity: analysis.severity,
                    anomalies: anomalies.length
                });
            } catch (error) {
                console.error(`Failed to process daily insight for ${brand.name}:`, error);
                results.push({ brand: brand.name, status: 'failed', error: String(error) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
