import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionDeliveryService } from '@/lib/services/SubscriptionDeliveryService';
import { EmailParserService } from '@/lib/services/EmailParserService';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { DailyInsightsService } from '@/lib/services/DailyInsightsService';
import { generateDailyInsights } from '@/lib/ai/daily-insights-generator';
import { syncDailyOverheadAction } from '@/lib/actions/rasa-ibu/finance';
import { syncDemandAccuracyAction } from '@/lib/actions/rasa-ibu/demandForecast';
import { EmailService } from '@/lib/services/EmailService';
import { subMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (max for Vercel Hobby/Pro)

/**
 * UNIFIED CRON WORKER
 * Last Deploy: 2026-01-15 00:43 WIB
 * Consolidates multiple background tasks into a single execution to stay within Vercel plan limits.
 */
export async function GET(req: NextRequest) {
    // 1. Authorization
    const authHeader = req.headers.get('authorization') || req.nextUrl.searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require CRON_SECRET for security
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any[] = [];
    const startTime = Date.now();

    // Time checks for frequency control
    const now = new Date();
    // We remove the strict adjustedHour === 1 check because Vercel Cron now handles the timing (18:00 UTC = 01:00 WIB).
    // This allows manual triggers for testing and makes the system more resilient.
    const isDailyWindow = true; // Daily tasks run on every scheduled trigger
    const isWeeklyWindow = now.getDay() === 1; // Monday
    const isMonthlyWindow = now.getDate() === 1; // 1st of month

    console.log(`[Unified Worker] Execution started at ${now.toISOString()}. Daily: ${isDailyWindow}, Weekly: ${isWeeklyWindow}, Monthly: ${isMonthlyWindow}`);

    try {
        const brands = await prisma.brand.findMany({ where: { isActive: true } });

        for (const brand of brands) {
            const brandResults: any = { brand: brand.name, tasks: [] };

            // TASK 1: Process Daily Deliveries (Run every hour or so, or in the daily window)
            if (isDailyWindow) {
                try {
                    const deliveryResults = await SubscriptionDeliveryService.processDailyDeliveries();
                    brandResults.tasks.push({ name: 'deliveries', status: 'success', count: deliveryResults.length });
                } catch (e) {
                    brandResults.tasks.push({ name: 'deliveries', status: 'failed', error: String(e) });
                }
            }

            // TASK 2: Subscription Billing (Daily window)
            if (isDailyWindow) {
                try {
                    const today = new Date();
                    const dueSubs = await prisma.subscription.findMany({
                        where: { status: 'ACTIVE', nextPaymentDate: { lte: today }, brandId: brand.id },
                        include: { items: { include: { variant: true } } }
                    });

                    let processedCount = 0;
                    for (const sub of dueSubs) { processedCount++; }
                    brandResults.tasks.push({ name: 'subscription-billing', status: 'success', count: processedCount });
                } catch (e) {
                    brandResults.tasks.push({ name: 'subscription-billing', status: 'failed', error: String(e) });
                }
            }

            // TASK 3: Email Sync (ALWAYS run to catch new orders)
            try {
                const email = process.env.EMAIL_ADDRESS;
                const password = process.env.EMAIL_APP_PASSWORD;
                if (email && password) {
                    const parser = new EmailParserService();
                    await parser.connect(email, password);
                    await parser.listenForOrders(brand.id);
                    await parser.disconnect();
                    brandResults.tasks.push({ name: 'email-sync', status: 'success' });
                }
            } catch (e) {
                brandResults.tasks.push({ name: 'email-sync', status: 'failed', error: String(e) });
            }

            // TASK 4: Daily Insights & Anomalies (Daily window)
            if (isDailyWindow) {
                try {
                    const dataService = new DailyInsightsService();
                    const notificationService = new ReportNotificationService();
                    const data = await dataService.collectDailyData(brand.id);
                    const anomalies = dataService.detectAnomalies(data);
                    const analysis = await generateDailyInsights(data, anomalies);
                    await notificationService.sendDailyInsight(brand.id, analysis, data);
                    brandResults.tasks.push({ name: 'daily-insights', status: 'success' });
                } catch (e) {
                    brandResults.tasks.push({ name: 'daily-insights', status: 'failed', error: String(e) });
                }
            }

            // TASK 5: Emergency Alerts (ALWAYS check every 15 mins)
            try {
                const notificationService = new ReportNotificationService();
                const lowStock = await prisma.frozenVariant.findMany({
                    where: { product: { category: { brandId: brand.id } }, stockOnHand: { lte: 5 } },
                    include: { product: true }
                });
                if (lowStock.length > 0) {
                    await notificationService.sendLowStockAlert(brand.id, lowStock.map(v => ({ name: v.product.name, stock: v.stockOnHand, min: 5 })));
                }
                brandResults.tasks.push({ name: 'emergency-alerts', status: 'success' });
            } catch (e) {
                brandResults.tasks.push({ name: 'emergency-alerts', status: 'failed', error: String(e) });
            }

            // TASK 6: Overhead & Accuracy Sync (Daily window)
            if (isDailyWindow) {
                try {
                    await syncDailyOverheadAction(brand.id);
                    await syncDemandAccuracyAction(brand.id);
                    brandResults.tasks.push({ name: 'sync-operations', status: 'success' });
                } catch (e) {
                    brandResults.tasks.push({ name: 'sync-operations', status: 'failed', error: String(e) });
                }
            }

            // TASK 7: Weekly Trend (Weekly window)
            if (isWeeklyWindow) {
                try {
                    const { MonthlyReportService } = await import('@/lib/services/MonthlyReportService');
                    const reportService = new MonthlyReportService();
                    const notificationService = new ReportNotificationService();
                    const data = await reportService.getWeeklyTrends(brand.id);
                    await notificationService.sendWeeklyTrend(brand.id, data);
                    brandResults.tasks.push({ name: 'weekly-trend', status: 'success' });
                } catch (e) {
                    brandResults.tasks.push({ name: 'weekly-trend', status: 'failed', error: String(e) });
                }
            }

            // TASK 8: Monthly Report (Monthly window)
            if (isMonthlyWindow) {
                try {
                    const { MonthlyReportService } = await import('@/lib/services/MonthlyReportService');
                    const { analyzeMonthlyData } = await import('@/lib/ai/monthly-report-analyzer');
                    const reportService = new MonthlyReportService();
                    const notificationService = new ReportNotificationService();
                    const data = await reportService.collectMonthlyData(brand.id);
                    const analysis = await analyzeMonthlyData(data);
                    await notificationService.sendMonthlyReport(brand.id, data, analysis);
                    brandResults.tasks.push({ name: 'monthly-report', status: 'success' });
                } catch (e) {
                    brandResults.tasks.push({ name: 'monthly-report', status: 'failed', error: String(e) });
                }
            }

            results.push(brandResults);
        }

        // TASK 9: Financial Consolidation (Monthly Window)
        // Runs once for the entire ecosystem (multi-brand)
        if (isMonthlyWindow) {
            try {
                const { ConsolidationEngine } = await import('@/lib/services/ConsolidationEngine');
                const engine = new ConsolidationEngine();
                await engine.generateConsolidatedStatement(now.getFullYear(), 'MONTHLY', 'CRON_WORKER');
                results.push({ task: 'financial-consolidation', status: 'success' });
            } catch (e: any) {
                results.push({ task: 'financial-consolidation', status: 'failed', error: e.message });
            }
        }

        // GLOBAL TASK: Process WhatsApp Queue (ALWAYS)
        const waResult = { task: 'whatsapp-queue', status: 'skipped', count: 0 };
        try {
            const { WhatsAppProcessor } = await import('@/lib/whatsapp/processor');
            const sentCount = await WhatsAppProcessor.processBatch(3); // Lower limit to avoid timeout
            waResult.status = 'success';
            waResult.count = sentCount;
        } catch (e: any) {
            waResult.status = 'failed';
            (waResult as any).error = e.message;
        }
        results.push(waResult);

        return NextResponse.json({
            success: true,
            duration: `${Date.now() - startTime}ms`,
            timestamp: now.toISOString(),
            isDailyWindow,
            results
        });

    } catch (error: any) {
        console.error('[Unified Worker] Critical failure:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: now.toISOString()
        }, { status: 500 });
    }
}
