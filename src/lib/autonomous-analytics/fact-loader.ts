// ACHIERA Autonomous Analytics - Fact Loader
// Transforms canonical data to fact tables

import { prisma } from '@/lib/prisma';

/**
 * Load canonical sales to fact table
 */
export async function loadSalesFacts(brandId: string, startDate?: Date): Promise<number> {
    const whereClause = startDate
        ? { brandId, transactionDate: { gte: startDate } }
        : { brandId };

    const canonicalRecords = await prisma.canonicalSalesTransaction.findMany({
        where: whereClause,
        orderBy: { transactionDate: 'asc' }
    });

    let loadedCount = 0;

    for (const record of canonicalRecords) {
        // Check if already loaded
        const existing = await prisma.salesFact.findFirst({
            where: { canonicalRecordId: record.id }
        });

        if (existing) continue;

        // Calculate derived metrics
        const costOfGoods = null; // TODO: Lookup from product master
        const grossProfit = costOfGoods ? record.netAmount - costOfGoods : null;

        // Create fact record
        await prisma.salesFact.create({
            data: {
                brandId: record.brandId,
                canonicalRecordId: record.id,
                dateKey: record.transactionDate,
                platform: record.platform,
                channel: record.channel,
                sku: record.sku,
                productName: record.productName,
                productCategory: record.productCategory,
                orderId: record.orderId,
                transactionTimestamp: record.transactionTime || record.transactionDate,
                quantity: record.quantity,
                unitPrice: record.unitPrice,
                totalAmount: record.totalAmount,
                discountAmount: record.discountAmount,
                netAmount: record.netAmount,
                costOfGoods,
                grossProfit,
                customerId: record.customerId,
                promotionId: null // TODO: Resolve promotion reference
            }
        });

        loadedCount++;
    }

    return loadedCount;
}

/**
 * Load canonical ads to fact table
 */
export async function loadAdsPerformanceFacts(brandId: string, startDate?: Date): Promise<number> {
    const whereClause = startDate
        ? { brandId, date: { gte: startDate } }
        : { brandId };

    const canonicalRecords = await prisma.canonicalAdsMetric.findMany({
        where: whereClause,
        orderBy: { date: 'asc' }
    });

    let loadedCount = 0;

    for (const record of canonicalRecords) {
        // Check if already loaded
        const existing = await prisma.adsPerformanceFact.findFirst({
            where: { canonicalRecordId: record.id }
        });

        if (existing) continue;

        // Create fact record
        await prisma.adsPerformanceFact.create({
            data: {
                brandId: record.brandId,
                canonicalRecordId: record.id,
                dateKey: record.date,
                platform: record.platform,
                campaignId: record.campaignId,
                campaignName: record.campaignName,
                impressions: record.impressions,
                clicks: record.clicks,
                spend: record.spend,
                conversions: record.conversions,
                revenue: record.revenue,
                ctr: record.ctr,
                cpc: record.cpc,
                cpa: record.cpa,
                roas: record.roas
            }
        });

        loadedCount++;
    }

    return loadedCount;
}

/**
 * Run full fact loading pipeline
 */
export async function runFactLoadingPipeline(brandId?: string): Promise<void> {
    console.log('[Fact Loader] Starting fact loading pipeline...');

    const brands = brandId
        ? [await prisma.brand.findUnique({ where: { id: brandId } })]
        : await prisma.brand.findMany({ where: { isActive: true } });

    for (const brand of brands) {
        if (!brand) continue;

        try {
            // Load sales facts
            const salesCount = await loadSalesFacts(brand.id);
            console.log(`[Fact Loader] ✓ ${brand.name}: Loaded ${salesCount} sales facts`);

            // Load ads facts
            const adsCount = await loadAdsPerformanceFacts(brand.id);
            console.log(`[Fact Loader] ✓ ${brand.name}: Loaded ${adsCount} ads facts`);
        } catch (error) {
            console.error(`[Fact Loader] ✗ Failed for brand ${brand.name}:`, error);
        }
    }

    console.log('[Fact Loader] Fact loading pipeline complete');
}

// CLI execution
if (require.main === module) {
    runFactLoadingPipeline()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fact loading failed:', error);
            process.exit(1);
        });
}
