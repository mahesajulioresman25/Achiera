import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    const { brandSlug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);

        // Support custom date ranges
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const days = parseInt(searchParams.get('days') || '7');

        let startDate: Date;
        let endDate: Date;

        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
        } else {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
        }

        // Get all events for the period
        const events = await prisma.analyticsEvent.findMany({
            where: {
                brandId: brand.id,
                createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate basic stats
        const stats = {
            totalPageViews: events.filter(e => e.type === 'PAGE_VIEW').length,
            totalCollectionClicks: events.filter(e => e.type === 'COLLECTION_CLICK').length,
            totalMockupOpens: events.filter(e => e.type === 'MOCKUP_OPEN').length,
            totalMockupConfirms: events.filter(e => e.type === 'MOCKUP_CONFIRM').length,
            totalHeroCtaClicks: events.filter(e => e.type === 'HERO_CTA_CLICK').length,
        };

        // Calculate conversion rates
        const conversionRates = {
            viewToClick: stats.totalPageViews > 0
                ? (stats.totalCollectionClicks / stats.totalPageViews) * 100
                : 0,
            clickToMockup: stats.totalCollectionClicks > 0
                ? (stats.totalMockupOpens / stats.totalCollectionClicks) * 100
                : 0,
            mockupToConfirm: stats.totalMockupOpens > 0
                ? (stats.totalMockupConfirms / stats.totalMockupOpens) * 100
                : 0,
            overallConversion: stats.totalPageViews > 0
                ? (stats.totalMockupConfirms / stats.totalPageViews) * 100
                : 0,
        };

        // Top collections
        const collectionClicks = events.filter(e => e.type === 'COLLECTION_CLICK' && e.collectionSlug);
        const collectionCounts = collectionClicks.reduce((acc, e) => {
            const slug = e.collectionSlug!;
            acc[slug] = (acc[slug] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCollections = Object.entries(collectionCounts)
            .map(([slug, count]) => ({ slug, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top pages
        const pageViews = events.filter(e => e.type === 'PAGE_VIEW' && e.path);
        const pageCounts = pageViews.reduce((acc, e) => {
            const path = e.path!;
            acc[path] = (acc[path] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topPages = Object.entries(pageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Daily breakdown
        const dailyStats = events.reduce((acc, e) => {
            const date = e.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    pageViews: 0,
                    collectionClicks: 0,
                    mockupOpens: 0,
                    mockupConfirms: 0,
                    heroCtaClicks: 0,
                };
            }
            if (e.type === 'PAGE_VIEW') acc[date].pageViews++;
            if (e.type === 'COLLECTION_CLICK') acc[date].collectionClicks++;
            if (e.type === 'MOCKUP_OPEN') acc[date].mockupOpens++;
            if (e.type === 'MOCKUP_CONFIRM') acc[date].mockupConfirms++;
            if (e.type === 'HERO_CTA_CLICK') acc[date].heroCtaClicks++;
            return acc;
        }, {} as Record<string, any>);

        // Hourly breakdown for today
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter(e => e.createdAt.toISOString().startsWith(today));
        const hourlyStats = todayEvents.reduce((acc, e) => {
            const hour = e.createdAt.getHours();
            if (!acc[hour]) {
                acc[hour] = { hour: `${hour}:00`, count: 0 };
            }
            acc[hour].count++;
            return acc;
        }, {} as Record<number, any>);

        // Session analytics
        const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size;
        const avgEventsPerSession = uniqueSessions > 0 ? events.length / uniqueSessions : 0;

        // Referrer analytics
        const referrers = events.filter(e => e.referrer).reduce((acc, e) => {
            const ref = e.referrer!;
            acc[ref] = (acc[ref] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topReferrers = Object.entries(referrers)
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return NextResponse.json({
            stats,
            conversionRates,
            topCollections,
            topPages,
            dailyStats: Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date)),
            hourlyStats: Object.values(hourlyStats).sort((a: any, b: any) => a.hour.localeCompare(b.hour)),
            sessionAnalytics: {
                uniqueSessions,
                avgEventsPerSession: Math.round(avgEventsPerSession * 10) / 10,
            },
            topReferrers,
            period: { startDate, endDate, days },
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
