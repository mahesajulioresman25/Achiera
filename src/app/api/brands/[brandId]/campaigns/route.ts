import { NextRequest, NextResponse } from 'next/server';
import { upsertCampaignAction } from '@/lib/actions/commerce/campaigns';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandId: string }> }
) {
    const { brandId } = await params;

    try {
        const campaigns = await prisma.campaign.findMany({
            where: { brandId: brandId },
            include: { bundles: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}


export async function POST(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
    const { brandId } = await params;
    console.log('[Campaign API] POST hit for brandId:', brandId);
    try {
        const body = await req.json();
        const result = await upsertCampaignAction(body, brandId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Campaign API] POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
    return POST(req, { params });
}
