import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/collections/[slug] - Get collection by slug with products
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Get collection with products
        const collection = await prisma.merchCollection.findFirst({
            where: {
                brandId: brand.id,
                slug,
                visibility: 'published',
                status: 'active'
            },
            include: {
                products: {
                    where: {
                        status: 'active'
                    },
                    include: {
                        variants: {
                            where: { isActive: true },
                            orderBy: { displayOrder: 'asc' },
                            take: 1 // Just get first variant for preview
                        },
                        mockupTemplates: {
                            where: { isActive: true },
                            take: 1
                        }
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            }
        });

        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        console.error('Error fetching collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
