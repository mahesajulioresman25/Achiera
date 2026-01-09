import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/products/[id] - Get product details with variants
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.mockupProductTemplate.findUnique({
            where: { id },
            include: {
                variants: {
                    where: { isActive: true },
                    orderBy: { basePrice: 'asc' }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Only return if product is active
        if (product.status !== 'active') {
            return NextResponse.json({ error: 'Product not available' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
