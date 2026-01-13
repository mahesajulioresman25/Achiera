
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const brandId = searchParams.get('brandId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') || undefined;

        if (!brandId) {
            return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
        }

        const logs = await prisma.appLog.findMany({
            where: {
                brandId,
                type: type ? { equals: type } : undefined
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
