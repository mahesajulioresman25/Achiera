import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/collections - Get all published collections
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug') || 'merch';

        // Get brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Get published collections
        const collections = await prisma.merchCollection.findMany({
            where: {
                brandId: brand.id,
                visibility: 'published',
                status: 'active'
            },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                coverImage: true,
                heroTitle: true,
                heroSubtitle: true,
                displayOrder: true,
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        return NextResponse.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
