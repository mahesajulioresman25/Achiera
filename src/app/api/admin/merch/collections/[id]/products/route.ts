import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/merch/collections/[id]/products - List products in collection
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const products = await prisma.collectionProduct.findMany({
            where: { collectionId: id },
            include: {
                product: {
                    include: {
                        variants: true
                    }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching collection products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/merch/collections/[id]/products - Add product to collection
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const {
            productId,
            showcaseImage,
            description,
            highlights,
            materialInfo,
            printingMethods,
            specifications,
            featured
        } = body;

        // Check if product already in collection
        const existing = await prisma.collectionProduct.findUnique({
            where: {
                collectionId_productId: {
                    collectionId: id,
                    productId: productId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Product already in collection' }, { status: 400 });
        }

        // Get current max display order
        const maxOrder = await prisma.collectionProduct.findFirst({
            where: { collectionId: id },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true }
        });

        const collectionProduct = await prisma.collectionProduct.create({
            data: {
                collectionId: id,
                productId,
                showcaseImage,
                description,
                highlights: highlights || [],
                materialInfo,
                printingMethods: printingMethods || [],
                specifications: specifications || {},
                featured: featured || false,
                displayOrder: (maxOrder?.displayOrder || 0) + 1
            },
            include: {
                product: {
                    include: {
                        variants: true
                    }
                }
            }
        });

        return NextResponse.json(collectionProduct, { status: 201 });
    } catch (error) {
        console.error('Error adding product to collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
