import { NextRequest, NextResponse } from 'next/server';
import { upsertFlashSaleConfig } from '@/lib/actions/commerce/flashSale';

export async function GET(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
    const { brandId } = await params;
    const { prisma } = await import('@/lib/prisma');
    try {
        const flashSales = await prisma.flashSaleConfig.findMany({
            where: {
                brandId: brandId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: true
            }
        });
        return NextResponse.json(flashSales);
    } catch (error: any) {
        console.error('[FlashSale API] GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
    const { brandId } = await params;
    console.log('[FlashSale API] POST hit for brandId:', brandId);
    try {
        const body = await req.json();
        const result = await upsertFlashSaleConfig(body, brandId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[FlashSale API] POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
    return POST(req, { params });
}
