
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug');

        if (!brandSlug) {
            return NextResponse.json({ error: 'Brand slug required' }, { status: 400 });
        }

        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { product: { brand: { slug: brandSlug } } },
                    { product: null } // Cart orders (assumed Merch for now)
                ]
            },
            include: {
                product: { select: { displayName: true } },
                variant: { select: { name: true, colorHex: true } },
                payments: true,
                orderItems: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Failed to fetch admin orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
