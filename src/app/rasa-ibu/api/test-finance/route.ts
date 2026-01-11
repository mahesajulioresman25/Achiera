
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeChartOfAccounts } from '@/lib/intelligence/chartOfAccounts';
import { MonthlyReportService } from '@/lib/services/MonthlyReportService';
import { DailyInsightsService } from '@/lib/services/DailyInsightsService';
import { FinancialReports } from '@/lib/intelligence/financialReports';
import { analyzeMonthlyData } from '@/lib/ai/monthly-report-analyzer';
import { generateDailyInsights } from '@/lib/ai/daily-insights-generator';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';

export async function GET() {
    try {
        const brandSlug = 'rasa-ibu';
        const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        const brandId = brand.id;

        // 1. Seed CoA
        const coaResult = await initializeChartOfAccounts(brandId);

        // 2. Monthly Report Logic
        const monthlyReportService = new MonthlyReportService();
        const monthlyData = await monthlyReportService.collectMonthlyData(brandId);
        const monthlyAnalysis = await analyzeMonthlyData(monthlyData);

        // 3. Daily Insight Logic
        const dailyInsightsService = new DailyInsightsService();
        const dailyData = await dailyInsightsService.collectDailyData(brandId);
        const anomalies = dailyInsightsService.detectAnomalies(dailyData);
        const dailyAnalysis = await generateDailyInsights(dailyData, anomalies);

        // 4. Notifications (Email Trigger)
        const notificationService = new ReportNotificationService();

        let notificationsStatus = {
            monthly: 'skipped',
            daily: 'skipped'
        };

        try {
            await notificationService.sendMonthlyReport(brandId, monthlyData, monthlyAnalysis);
            notificationsStatus.monthly = 'sent';
        } catch (e: any) {
            notificationsStatus.monthly = `failed: ${e.message}`;
        }

        try {
            await notificationService.sendDailyInsight(brandId, dailyAnalysis, dailyData);
            notificationsStatus.daily = 'sent';
        } catch (e: any) {
            notificationsStatus.daily = `failed: ${e.message}`;
        }

        // 5. Environment Check (Helpful for debugging)
        const envCheck = {
            SMTP_USER: !!process.env.SMTP_USER,
            SMTP_PASS: !!process.env.SMTP_PASS,
            WA_ADMIN_EMAIL: !!process.env.WA_ADMIN_EMAIL,
            SMTP_HOST: process.env.SMTP_HOST || 'default (smtp.gmail.com)',
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
        };

        return NextResponse.json({
            success: true,
            brand: { id: brandId, slug: brandSlug },
            coa: coaResult,
            notifications: notificationsStatus,
            envCheck,
            data: {
                monthly: monthlyData,
                daily: dailyData
            }
        });
    } catch (error: any) {
        console.error('Test Action Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
