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
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!startDateParam || !endDateParam) {
            return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
        }

        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        // Get all events for the period
        const events = await prisma.analyticsEvent.findMany({
            where: {
                brandId: brand.id,
                createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Generate CSV
        const headers = ['Date', 'Time', 'Event Type', 'Path', 'Collection', 'Session ID', 'Referrer'];
        const rows = events.map(event => [
            event.createdAt.toISOString().split('T')[0],
            event.createdAt.toISOString().split('T')[1].split('.')[0],
            event.type,
            event.path || '',
            event.collectionSlug || '',
            event.sessionId || '',
            event.referrer || '',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="analytics-${brandSlug}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Analytics export error:', error);
        return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
    }
}
