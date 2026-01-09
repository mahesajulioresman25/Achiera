import { NextResponse } from 'next/server';
import { PriceCalculator } from '@/lib/pricing/PriceCalculator';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, variantId, quantity, options } = body;

        if (!productId || !variantId || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // We need Brand ID for scope resolution. Product -> Collection -> Brand.
        const product = await prisma.mockupProductTemplate.findUnique({
            where: { id: productId },
            include: { collection: true }
        });

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const brandId = product.collection.brandId;

        const breakdown = await PriceCalculator.calculate({
            brandId,
            productId,
            variantId,
            quantity,
            options: options || {}
        });

        return NextResponse.json(breakdown);

    } catch (error: any) {
        console.error('Pricing Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
