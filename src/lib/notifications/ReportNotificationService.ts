
import { sendWhatsAppMessageAction } from '@/lib/actions/rasa-ibu/whatsapp';
import { AIAnalysis } from '@/lib/ai/monthly-report-analyzer';
import { DailyAIAnalysis } from '@/lib/ai/daily-insights-generator';
import { MonthlyData } from '@/lib/services/MonthlyReportService';
import { DailyData } from '@/lib/services/DailyInsightsService';
import { prisma } from '@/lib/prisma';
import React from 'react';

export class ReportNotificationService {

    // Helper to get owner phone
    private async getOwnerPhone(brandId: string): Promise<string | null> {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { name: true, paymentSettings: true }
        });

        if (!brand) return null;

        // Try to get from settings first
        const settings = brand.paymentSettings as any;
        if (settings?.whatsappCrm) {
            // Ensure cleaning of non-numeric chars
            return settings.whatsappCrm.replace(/\D/g, '');
        }

        // Only fallback if it's Rasa Ibu
        if (brand.name !== 'Rasa Ibu') return null;

        return '6282215191435';
    }

    private async getBrandWhatsApp(brandId: string): Promise<string | null> {
        return this.getOwnerPhone(brandId);
    }

    // Send Monthly Report via Email
    async sendMonthlyReport(brandId: string, data: MonthlyData, analysis: AIAnalysis) {
        const email = process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER;
        if (!email) return;

        const monthName = data.period.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const { EmailService } = await import('@/lib/services/EmailService');
        const { MonthlyReportPDF } = await import('@/lib/pdf/MonthlyReportPDF');
        const ReactPDF = await import('@react-pdf/renderer');
        const React = await import('react');

        // Generate PDF Buffer
        let pdfAttachment = null;
        try {
            const buffer = await ReactPDF.renderToBuffer(
                React.createElement(MonthlyReportPDF, { data, analysis }) as any
            );

            pdfAttachment = [{
                filename: `Laporan_Rasa_Ibu_${monthName.replace(/\s/g, '_')}.pdf`,
                content: buffer,
                contentType: 'application/pdf'
            }];
            console.log(`[ReportNotificationService] PDF generated for ${monthName}`);
        } catch (pdfError) {
            console.error('[ReportNotificationService] PDF generation failed:', pdfError);
        }

        const message = `
            <h2>📊 Laporan Bisnis Rasa Ibu - ${monthName}</h2>
            
            <p><strong>💰 Performa Keuangan</strong></p>
            <ul>
                <li>Omset: Rp ${data.financial.revenue.toLocaleString('id-ID')}</li>
                <li>Profit: Rp ${data.financial.profit.toLocaleString('id-ID')} (Margin ${data.financial.margin.toFixed(1)}%)</li>
                <li>Pertumbuhan: ${data.financial.growthRevenue.toFixed(1)}% vs bulan lalu</li>
            </ul>

            <p><strong>📈 Key Performance Indicators (KPI)</strong></p>
            <ul>
                <li>LTV/CAC Ratio: ${data.kpis.ltvToCac.toFixed(2)} ${data.kpis.ltvToCac > 3 ? '✅ (Sehat)' : '⚠️ (Butuh Optimasi)'}</li>
                <li>Current Ratio: ${data.kpis.currentRatio.toFixed(2)} ${data.kpis.currentRatio >= 1.5 ? '✅ (Likuid)' : '⚠️ (Arus Kas Ketat)'}</li>
                <li>Inventory Turnover: ${data.kpis.inventoryTurnover.toFixed(1)}x</li>
                <li>Retention Rate: ${data.kpis.retentionRate}%</li>
            </ul>

            <p><strong>🏆 Produk Terlaris</strong></p>
            <ul>
                ${data.sales.topProducts.slice(0, 3).map((p, i) => `<li>${p.name} (${p.quantity} terjual)</li>`).join('')}
            </ul>

            <p><strong>🧠 Analisis Strategis AI</strong></p>
            <ul>
                ${analysis.insights.map(i => `<li>${i}</li>`).join('')}
            </ul>

            <p style="background: #F9F7F2; padding: 15px; border-radius: 10px; border: 1px dashed #D1CBBF;">
                <strong>Rekomendasi Utama:</strong><br>
                ${analysis.recommendations[0]}
            </p>

            <p><em>Note: Laporan eksekutif lengkap dengan grafik dan breakdown detail terlampir dalam format PDF.</em></p>
        `;

        await EmailService.sendAdminAlert(`Laporan Bulanan - ${monthName}`, message, pdfAttachment || undefined);
    }

    // Send Daily Insight via Email
    async sendDailyInsight(brandId: string, analysis: DailyAIAnalysis, data?: DailyData) {
        const email = process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER;
        if (!email) return;

        const { EmailService } = await import('@/lib/services/EmailService');
        const { DailyInsightPDF } = await import('@/lib/pdf/DailyInsightPDF');
        const ReactPDF = await import('@react-pdf/renderer');
        const React = await import('react');

        const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        // Generate PDF Buffer
        let pdfAttachment = null;
        if (data) {
            try {
                const buffer = await ReactPDF.renderToBuffer(
                    React.createElement(DailyInsightPDF, { data, analysis }) as any
                );

                pdfAttachment = [{
                    filename: `Insight_Harian_Rasa_Ibu_${date.replace(/\s/g, '_')}.pdf`,
                    content: buffer,
                    contentType: 'application/pdf'
                }];
                console.log(`[ReportNotificationService] Daily PDF generated for ${date}`);
            } catch (pdfError) {
                console.error('[ReportNotificationService] Daily PDF generation failed:', pdfError);
            }
        }

        const message = `
            <h3>📅 Insight Harian - ${date}</h3>
            ${data ? `<p>Omset: Rp ${data.today.revenue.toLocaleString()}</p>` : ''}
            <p><strong>Analisis AI:</strong><br>${analysis.analysis}</p>
            <p><strong>Rekomendasi:</strong><br>${analysis.recommendations.join('<br>')}</p>
            <p><em>Note: Detail insight harian terlampir dalam format PDF.</em></p>
        `;

        await EmailService.sendAdminAlert(`Insight Harian - ${date}`, message, pdfAttachment || undefined);
    }

    // Send Weekly Trend via Email
    async sendWeeklyTrend(brandId: string, data: any) {
        const email = process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER;
        if (!email) return;

        const { EmailService } = await import('@/lib/services/EmailService');
        const dateRange = `${data.period.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${data.period.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;

        const message = `
            <h3>📈 Review Mingguan - ${dateRange}</h3>
            <p>Omset: Rp ${data.revenue.toLocaleString()}</p>
            <p>Total Pesanan: ${data.totalOrders}</p>
            <p>Pertumbuhan: ${data.growth.toFixed(1)}%</p>
            <p><strong>Channel:</strong><br>${Object.entries(data.channels).map(([name, val]: [string, any]) => `• ${name}: Rp ${val.toLocaleString()}`).join('<br>')}</p>
        `;

        await EmailService.sendAdminAlert(`Review Mingguan - ${dateRange}`, message);
    }

    async sendLowStockAlert(brandId: string, items: Array<{ name: string; stock: number; min: number }>) {
        const { EmailService } = await import('@/lib/services/EmailService');
        const message = `Beberapa item stok menipis:<br>${items.map(i => `• ${i.name}: Sisa ${i.stock}`).join('<br>')}`;
        await EmailService.sendAdminAlert('STOK KRITIS', message);
    }

    async sendCancellationAlert(brandId: string, orderDetails: any) {
        const { EmailService } = await import('@/lib/services/EmailService');
        const message = `Pembatalan Pesanan:<br>Invoice: ${orderDetails.invoiceNo}<br>Customer: ${orderDetails.customerName}`;
        await EmailService.sendAdminAlert('ALERT PEMBATALAN', message);
    }
}
