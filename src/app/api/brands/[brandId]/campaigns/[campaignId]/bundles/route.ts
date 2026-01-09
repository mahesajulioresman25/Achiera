import { NextRequest, NextResponse } from 'next/server';
import { upsertBundleAction, deleteBundleAction } from '@/lib/actions/commerce/bundles';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string, campaignId: string }> }
) {
    const { campaignId } = await params;
    try {
        const bundles = await prisma.productBundle.findMany({
            where: { campaignId },
            include: { items: { include: { variant: { include: { product: true } } } } }
        });
        return NextResponse.json(bundles);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string, campaignId: string }> }
) {
    const { campaignId } = await params;
    try {
        const body = await req.json();
        const result = await upsertBundleAction(campaignId, body);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string, campaignId: string }> }
) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        await deleteBundleAction(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
