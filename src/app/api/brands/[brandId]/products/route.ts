import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    let { brandId } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';

    // Robustly resolve Brand ID (whether it's UUID or Slug)
    const brand = await prisma.brand.findFirst({
        where: {
            OR: [
                { id: brandId },
                { slug: brandId }
            ]
        },
        select: { id: true }
    });

    // If brand found, use its ID. If not, filtered query below will just return empty (safely).
    if (brand) {
        brandId = brand.id;
    }

    try {
        const products = await prisma.frozenProduct.findMany({
            where: {
                OR: [
                    // A. Products linked to this brand
                    { category: { brandId: brandId } },
                    // B. OR Orhpan products (No Category) - usually test/uncategorized items
                    { categoryId: null }
                ],
                // AND: Search details
                AND: [
                    query ? {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                            { slug: { contains: query, mode: 'insensitive' } }
                        ]
                    } : {}
                ]
            },
            include: {
                variants: true
            },
            take: 20
        });

        return NextResponse.json({ products });
    } catch (error: any) {
        console.error('[Products Search API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
