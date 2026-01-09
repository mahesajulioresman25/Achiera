import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get('scope');
    const brandSlug = searchParams.get('brandSlug'); // Optional filtering

    if (!scope) {
        return NextResponse.json({ error: 'Scope required' }, { status: 400 });
    }

    try {
        let items: any[] = [];

        if (scope === 'PRODUCT') {
            items = await prisma.mockupProductTemplate.findMany({
                where: {
                    collection: brandSlug ? {
                        brand: {
                            slug: brandSlug
                        }
                    } : undefined
                },
                select: {
                    id: true,
                    name: true
                    // Removed 'images' as it does not exist on Product model
                },
                orderBy: { name: 'asc' }
            });
        } else if (scope === 'VARIANT') {
            items = await prisma.mockupVariant.findMany({
                where: {
                    product: brandSlug ? {
                        collection: {
                            brand: {
                                slug: brandSlug
                            }
                        }
                    } : undefined
                },
                select: {
                    id: true,
                    name: true,
                    product: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    product: {
                        name: 'asc'
                    }
                }
            });
            // Map to friendly name
            items = items.map(i => ({
                id: i.id,
                name: `${i.product.name} - ${i.name}`
            }));
        } else if (scope === 'BRAND') {
            items = await prisma.brand.findMany({
                select: { id: true, name: true }
            });
        }

        return NextResponse.json(items);

    } catch (error) {
        console.error('Error fetching scope options:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
