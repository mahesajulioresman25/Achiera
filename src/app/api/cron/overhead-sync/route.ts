
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncDailyOverheadAction } from '@/lib/actions/rasa-ibu/finance';
import { syncDemandAccuracyAction } from '@/lib/actions/rasa-ibu/demandForecast';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        const results = [];

        for (const brand of brands) {
            try {
                // Sync Daily Overhead
                await syncDailyOverheadAction(brand.id);

                // Sync AI Demand Accuracy
                await syncDemandAccuracyAction(brand.id);

                results.push({
                    brand: brand.name,
                    status: 'success'
                });
            } catch (error) {
                console.error(`Failed to sync overhead for ${brand.name}:`, error);
                results.push({ brand: brand.name, status: 'failed', error: String(error) });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Daily Overhead & AI Accuracy Sync completed',
            results
        });
    } catch (error) {
        console.error('[Cron] Overhead Sync Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
