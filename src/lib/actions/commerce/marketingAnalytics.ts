'use server';

import { prisma } from '@/lib/prisma';

export async function getMarketingAnalyticsAction(brandIdInput: string) {
    let brandId = brandIdInput;
    if (!brandId.startsWith('c')) {
        const brand = await prisma.brand.findUnique({ where: { slug: brandIdInput } });
        if (brand) brandId = brand.id;
    }

    const flashSales = await prisma.flashSaleConfig.findMany({
        where: { brandId },
        include: {
            items: true // Changed from orders which doesn't exist
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const flashSaleStats = flashSales.map((fs: any) => ({
        name: fs.name,
        totalSales: 0, // Cannot calculate easily without relation, return 0 for now
        orderCount: 0,
        isActive: fs.isActive
    }));

    // 2. Best Selling Bundles
    const bundles = await prisma.productBundle.findMany({
        where: { campaign: { brandId } },
        include: {
            orderItems: {
                include: { order: true }
            }
        }
    });

    const bundleStats = bundles.map((b: any) => ({
        name: b.name,
        sold: b.orderItems.length,
        revenue: b.orderItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0)
    })).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

    // 3. Campaign Performance
    const campaigns = await prisma.campaign.findMany({
        where: { brandId },
        include: {
            bundles: {
                include: {
                    orderItems: { select: { subtotal: true } }
                }
            }
        }
    });

    const campaignStats = campaigns.map((c: any) => ({
        title: c.title,
        revenue: c.bundles.reduce((sum: number, b: any) => sum + b.orderItems.reduce((s: number, i: any) => s + Number(i.subtotal), 0), 0)
    }));

    return {
        flashSaleStats,
        bundleStats,
        campaignStats
    };
}
