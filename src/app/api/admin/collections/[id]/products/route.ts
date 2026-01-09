import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/collections/[id]/products - Get products in collection
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const products = await prisma.mockupProductTemplate.findMany({
            where: { collectionId: id },
            include: {
                variants: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                },
                mockupTemplates: {
                    where: { isActive: true }
                },
                _count: {
                    select: { variants: true, mockupTemplates: true }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/collections/[id]/products - Create product in collection
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: collectionId } = await params;
        const body = await req.json();

        // Verify collection exists
        const collection = await prisma.merchCollection.findUnique({
            where: { id: collectionId }
        });

        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Create product
        const product = await prisma.mockupProductTemplate.create({
            data: {
                collectionId,
                slug: body.slug,
                sku: body.sku,
                name: body.name,
                productType: body.productType,
                baseImage: body.baseImage,
                description: body.description,
                isCustomizable: body.isCustomizable ?? true,
                isFeatured: body.isFeatured ?? false,
                status: body.status || 'active',
                displayOrder: body.displayOrder || 0,
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription
            },
            include: {
                variants: true,
                mockupTemplates: true
            }
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('Error creating product:', error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Product slug or SKU already exists' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
