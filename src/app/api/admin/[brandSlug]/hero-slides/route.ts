import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    try {
        const { brandSlug } = await params;

        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const slides = await prisma.heroSlide.findMany({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(slides);
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { brandSlug } = await params;

        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const body = await request.json();

        // Get max sortOrder
        const maxSlide = await prisma.heroSlide.findFirst({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'desc' },
        });

        const slide = await prisma.heroSlide.create({
            data: {
                brandId: brand.id,
                title: body.title,
                subtitle: body.subtitle,
                ctaLabel: body.ctaLabel,
                ctaLink: body.ctaLink,
                mediaType: body.mediaType || 'IMAGE',
                imageUrl: body.imageUrl,
                videoUrl: body.videoUrl,
                sortOrder: (maxSlide?.sortOrder || 0) + 1,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(slide);
    } catch (error) {
        console.error('Error creating hero slide:', error);
        return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 });
    }
}
