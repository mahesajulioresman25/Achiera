import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/merch/collections - List all active collections
export async function GET(req: NextRequest) {
    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            console.warn('Merch brand not found for collections');
            return NextResponse.json([]);
        }

        // Fetch all collections (ordered by creation date)
        const collections = await prisma.merchCollection.findMany({
            where: {
                brandId: brand.id,
                status: 'active',
                visibility: 'published'
            },
            select: {
                id: true,
                slug: true,
                name: true,
                heroTitle: true,
                heroSubtitle: true,
                highlights: true,
                galleryImages: true,
                coverImage: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json([]);
    }
}
