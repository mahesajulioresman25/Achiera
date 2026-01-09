import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/products/[id]/variants - Get product variants
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;

        const variants = await prisma.mockupVariant.findMany({
            where: { productId },
            include: {
                mockupTemplates: {
                    where: { isActive: true }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        return NextResponse.json(variants);
    } catch (error) {
        console.error('Error fetching variants:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/products/[id]/variants - Create variant
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;
        const body = await req.json();

        // Verify product exists
        const product = await prisma.mockupProductTemplate.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create variant
        const variant = await prisma.mockupVariant.create({
            data: {
                productId,
                name: body.name,
                sku: body.sku,
                attributes: body.attributes || {},
                basePrice: body.basePrice,
                compareAtPrice: body.compareAtPrice,
                stockStatus: body.stockStatus || 'in-stock',
                stockQuantity: body.stockQuantity,
                lowStockAlert: body.lowStockAlert,
                productionTime: body.productionTime,
                weight: body.weight,
                dimensions: body.dimensions,
                displayOrder: body.displayOrder || 0,
                isActive: body.isActive ?? true
            }
        });

        return NextResponse.json(variant, { status: 201 });
    } catch (error: any) {
        console.error('Error creating variant:', error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Variant SKU already exists' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
