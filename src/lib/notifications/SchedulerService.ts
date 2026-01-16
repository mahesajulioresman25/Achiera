
import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { DailyInsightsService } from '@/lib/services/DailyInsightsService';
import { MonthlyReportService } from '@/lib/services/MonthlyReportService';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { generateDailyInsights } from '@/lib/ai/daily-insights-generator';
import { analyzeMonthlyData } from '@/lib/ai/monthly-report-analyzer';
import { subMinutes } from 'date-fns';
import { syncDailyOverheadAction } from '@/lib/actions/rasa-ibu/finance';
import { syncDemandAccuracyAction } from '@/lib/actions/rasa-ibu/demandForecast';

class SchedulerService {
    private static instance: SchedulerService;
    private isRunning = false;

    private dailyService = new DailyInsightsService();
    private monthlyService = new MonthlyReportService();
    private notificationService = new ReportNotificationService();

    private constructor() { }

    public static getInstance(): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }

    public start() {
        if (this.isRunning) return;

        // Disable node-cron in production (Vercel) as it won't persist
        // Tasks are consolidated in unified-worker API
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        this.isRunning = true;

        // 1. Daily Insight: Every day at 21:00 (9 PM)
        // 1. Daily Insight: Every day at 21:00 (9 PM)
        cron.schedule('0 21 * * *', () => {
            // Detach execution to prevent blocking the scheduler check
            setImmediate(async () => {
                await this.runDailyInsight();
            });
        });

        // 2. Weekly Trend: Every Monday at 08:00
        cron.schedule('0 8 * * 1', () => {
            setImmediate(async () => {
                setImmediate(async () => {
                    await this.runWeeklyTrend();
                });
            });

            // 3. Monthly Report: Every 1st of the month at 08:00
            cron.schedule('0 8 1 * *', () => {
                setImmediate(async () => {
                    setImmediate(async () => {
                        await this.runMonthlyReport();
                    });
                });

                // 4. Emergency Alerts: Every 15 minutes
                cron.schedule('*/15 * * * *', async () => {
                    await this.runEmergencyAlerts();
                });

                // 5. Daily Overhead Sync: Every day at 01:00 AM
                cron.schedule('0 1 * * *', async () => {
                    await this.runDailyOverheadSync();
                });


            }

    private async runDailyInsight() {
                try {
                    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
                    if(!brand) return;

                    const data = await this.dailyService.collectDailyData(brand.id);
                    const anomalies = this.dailyService.detectAnomalies(data);
                    const analysis = await generateDailyInsights(data, anomalies);

                    await this.notificationService.sendDailyInsight(brand.id, analysis, data);
                } catch(e) {
                    console.error('[Scheduler] Error in Daily Insight:', e);
                }
            }

    private async runWeeklyTrend() {
                try {
                    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
                    if(!brand) return;

                    const data = await this.monthlyService.getWeeklyTrends(brand.id);
                    await this.notificationService.sendWeeklyTrend(brand.id, data);
                } catch(e) {
                    console.error('[Scheduler] Error in Weekly Trend:', e);
                }
            }

    private async runMonthlyReport() {
                try {
                    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
                    if(!brand) return;

                    const data = await this.monthlyService.collectMonthlyData(brand.id);
                    const analysis = await analyzeMonthlyData(data);

                    await this.notificationService.sendMonthlyReport(brand.id, data, analysis);
                } catch(e) {
                    console.error('[Scheduler] Error in Monthly Report:', e);
                }
            }

    private async runEmergencyAlerts() {
                try {
                    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
                    if(!brand) return;

                    // Low Stock Check
                    const lowStockItems = await prisma.frozenVariant.findMany({
                        where: {
                            product: { category: { brandId: brand.id } },
                            stockOnHand: { lte: 5 }
                        },
                        include: { product: true }
                    });

                    if(lowStockItems.length > 0) {
                const items = lowStockItems.map(v => ({
                    name: v.product.name,
                    stock: v.stockOnHand,
                    min: 5
                }));
                await this.notificationService.sendLowStockAlert(brand.id, items);
            }

            // Recent Cancellations
            const recentCancellations = await prisma.order.findMany({
                where: {
                    brandId: brand.id,
                    status: 'CANCELLED',
                    updatedAt: { gte: subMinutes(new Date(), 15) }
                }
            });

            for (const order of recentCancellations) {
                await this.notificationService.sendCancellationAlert(brand.id, {
                    invoiceNo: order.invoiceNo || order.id,
                    total: order.total,
                    customerName: (order as any).customerName
                });
            }
        } catch (e) {
            console.error('[Scheduler] Error in Emergency Alerts:', e);
        }
    }

    private async runDailyOverheadSync() {
        try {
            const brands = await prisma.brand.findMany({ select: { id: true } });
            for (const brand of brands) {
                await syncDailyOverheadAction(brand.id);
                await syncDemandAccuracyAction(brand.id);
            }
        } catch (e) {
            console.error('[Scheduler] Error in Daily Overhead Sync:', e);
        }
    }
}

export const schedulerService = SchedulerService.getInstance();
