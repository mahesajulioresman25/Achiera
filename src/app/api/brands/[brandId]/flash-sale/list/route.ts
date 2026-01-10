import { NextRequest, NextResponse } from 'next/server';

// Explicit route for /list to avoid conflict with [id] param route and 405 Method Not Allowed
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
        console.error('[FlashSale List API] GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
