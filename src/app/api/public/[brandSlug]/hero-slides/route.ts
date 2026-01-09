import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    try {
        const { brandSlug } = await params;

        // Find brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            console.warn(`Brand not found: ${brandSlug}`);
            return NextResponse.json([]);
        }

        // Fetch active hero slides
        const slides = await prisma.heroSlide.findMany({
            where: {
                brandId: brand.id,
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
            select: {
                id: true,
                title: true,
                subtitle: true,
                mediaType: true,
                imageUrl: true,
                videoUrl: true,
                ctaLabel: true,
                ctaLink: true,
                sortOrder: true,
            },
        });

        return NextResponse.json(slides);
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return NextResponse.json([]);
    }
}
