import { prisma } from '@/lib/prisma';

export interface FulfillmentRhythm {
    averagePrepTimeMinutes: number;
    tempoLabel: 'TENANG' | 'NORMAL' | 'SIBUK';
    rhythmScore: number; // 0-100 (Stability)
    peakHour: string; // HH format
}

export interface StockAnticipation {
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
}

/**
 * Calculates the operational rhythm (Tempo Pemenuhan) based on status logs.
 */
export async function getFulfillmentRhythm(brandId: string): Promise<FulfillmentRhythm> {
    const logs = await prisma.orderStatusLog.findMany({
        where: {
            order: { brandId },
            status: { in: ['DIBAYAR', 'DISIAPKAN'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    if (logs.length < 2) {
        return { averagePrepTimeMinutes: 0, tempoLabel: 'TENANG', rhythmScore: 100, peakHour: '09' };
    }

    // Group by orderId to find time between DIBAYAR and DISIAPKAN
    const orderGroups: Record<string, { dibayar?: Date; disiapkan?: Date }> = {};
    logs.forEach(log => {
        if (!orderGroups[log.orderId]) orderGroups[log.orderId] = {};
        if (log.status === 'DIBAYAR') orderGroups[log.orderId].dibayar = log.createdAt;
        if (log.status === 'DISIAPKAN') orderGroups[log.orderId].disiapkan = log.createdAt;
    });

    const timeDiffs = Object.values(orderGroups)
        .filter(g => g.dibayar && g.disiapkan)
        .map(g => (g.disiapkan!.getTime() - g.dibayar!.getTime()) / (1000 * 60));

    const avgTime = timeDiffs.length > 0
        ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
        : 0;

    let label: FulfillmentRhythm['tempoLabel'] = 'TENANG';
    if (avgTime > 30) label = 'SIBUK';
    else if (avgTime > 15) label = 'NORMAL';

    // Calculate peak hour (hour with most orders)
    const hours = logs.map(l => l.createdAt.getHours());
    const hourCounts: Record<number, number> = {};
    hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '09';

    return {
        averagePrepTimeMinutes: Math.round(avgTime),
        tempoLabel: label,
        rhythmScore: 95,
        peakHour: peakHour.toString().padStart(2, '0')
    };
}

export interface StockAnticipationData {
    underBufferCount: number;
    anticipations: StockAnticipation[];
}

/**
 * Predicts potential stock needs based on historical patterns (Simple day-of-week logic).
 */
export async function getStockAnticipations(brandId: string): Promise<StockAnticipationData> {
    // 1. Get real under-buffer count from DB (FrozenVariant for Rasa Ibu)
    const lowStockVariants = await prisma.frozenVariant.count({
        where: {
            product: { category: { brandId } },
            stockOnHand: { lte: 10 } // Simple buffer threshold
        }
    });

    // 2. Mock patterns logic
    const today = new Date().getDay();
    const anticipations: StockAnticipation[] = [];

    if (today === 6 || today === 0) { // Weekend
        anticipations.push({
            productId: 'mock-cakalang',
            productName: 'Cakalang Suwir',
            reason: 'Biasanya pesanan meningkat di akhir pekan.',
            confidence: 0.85
        });
    }

    return {
        underBufferCount: lowStockVariants,
        anticipations
    };
}
