
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug');

        // Allow fetching by brand slug if provided, otherwise fetch all (or fail if strict)
        // User request: response type PublicMockupTemplateSummary

        let whereClause = {};
        if (brandSlug) {
            const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
            if (brand) {
                whereClause = { brandId: brand.id };
            } else {
                return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
            }
        }

        const templates = await prisma.mockupProductTemplate.findMany({
            where: whereClause,
            select: {
                id: true,
                slug: true,
                displayName: true,
                productType: true,
                variants: {
                    take: 1,
                    select: {
                        baseImageUrl: true,
                        colorHex: true
                    }
                }
            },
            orderBy: { displayName: 'asc' }
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching public templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}
