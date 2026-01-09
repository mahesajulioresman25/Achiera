
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReportNotificationService } from '@/lib/notifications/ReportNotificationService';
import { subMinutes } from 'date-fns';

export async function GET(req: Request) {
    try {
        const notificationService = new ReportNotificationService();
        const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
        if (!brand) return NextResponse.json({ success: false, error: 'Brand not found' });

        const results = [];

        // 1. Check Low Stock
        const lowStockItems = await prisma.frozenVariant.findMany({
            where: {
                product: { category: { brandId: brand.id } },
                stockOnHand: { lte: 5 } // Using fixed threshold for priority items for now
            },
            include: { product: true }
        });

        if (lowStockItems.length > 0) {
            const items = lowStockItems.map(v => ({
                name: v.product.name,
                stock: v.stockOnHand,
                min: 5
            }));
            await notificationService.sendLowStockAlert(brand.id, items);
            results.push('Low stock alerts sent');
        }

        // 2. Check Recent Cancellations (last 30 mins)
        const recentCancellations = await prisma.order.findMany({
            where: {
                brandId: brand.id,
                status: 'CANCELLED',
                updatedAt: { gte: subMinutes(new Date(), 30) }
            }
        });

        for (const order of recentCancellations) {
            await notificationService.sendCancellationAlert(brand.id, {
                invoiceNo: order.invoiceNo || order.id,
                total: order.total,
                customerName: (order as any).customerName
            });
            results.push(`Cancellation alert sent for ${order.id}`);
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (error: any) {
        console.error('[Emergency Alert Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
