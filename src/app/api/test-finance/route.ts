
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeChartOfAccounts } from '@/lib/intelligence/chartOfAccounts';
import { MonthlyReportService } from '@/lib/services/MonthlyReportService';
import { FinancialReports } from '@/lib/intelligence/financialReports';

export async function GET() {
    try {
        const brandSlug = 'rasa-ibu';
        const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        const brandId = brand.id;

        // 1. Seed CoA
        const coaResult = await initializeChartOfAccounts(brandId);

        // 2. Trigger Daily Report (P&L for today)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const dailyPL = await FinancialReports.getProfitLoss(brandId, { start: startOfDay, end: endOfDay });

        // 3. Trigger Monthly Report
        const reportService = new MonthlyReportService();
        const monthlyData = await reportService.collectMonthlyData(brandId, now);

        return NextResponse.json({
            success: true,
            brand: { id: brandId, slug: brandSlug },
            coa: coaResult,
            dailyReport: dailyPL,
            monthlyReport: monthlyData
        });
    } catch (error: any) {
        console.error('Test Action Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
