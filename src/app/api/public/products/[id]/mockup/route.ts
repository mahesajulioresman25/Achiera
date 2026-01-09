import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/products/[id]/mockup - Get mockup template for product
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = req.nextUrl.searchParams;
        const variantId = searchParams.get('variantId');

        // Try to find variant specific template first if variantId provided
        let template = null;

        if (variantId) {
            template = await prisma.mockupTemplate.findFirst({
                where: {
                    productId: id,
                    variantId: variantId,
                    isActive: true
                }
            });
        }

        // If no variant specific, or no variantId, get default product template
        if (!template) {
            template = await prisma.mockupTemplate.findFirst({
                where: {
                    productId: id,
                    variantId: null,
                    isActive: true
                }
            });
        }

        if (!template) {
            return NextResponse.json({ error: 'No mockup template found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error fetching mockup template:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
