import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Fetch settings for this brand
        const settings = await prisma.merchSettings.findFirst({
            where: { brandId: brand.id }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching merch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const body = await request.json();

        // Upsert settings for this brand
        const settings = await prisma.merchSettings.upsert({
            where: { brandId: brand.id },
            update: {
                heroTitle: body.heroTitle,
                heroSubtitle: body.heroSubtitle,
                heroTagline: body.heroTagline,
                heroCtaLabel: body.heroCtaLabel,
                heroCtaLink: body.heroCtaLink,
                highlightLine: body.highlightLine,
                mockupTitle: body.mockupTitle,
                mockupSubtitle: body.mockupSubtitle,
                mockupTagline: body.mockupTagline,
                mockupEnabled: body.mockupEnabled,
            },
            create: {
                brandId: brand.id,
                heroTitle: body.heroTitle,
                heroSubtitle: body.heroSubtitle,
                heroTagline: body.heroTagline,
                heroCtaLabel: body.heroCtaLabel,
                heroCtaLink: body.heroCtaLink,
                highlightLine: body.highlightLine,
                mockupTitle: body.mockupTitle || 'Try Live Mockup',
                mockupSubtitle: body.mockupSubtitle || 'See your design on our products',
                mockupTagline: body.mockupTagline || 'Fast, accurate, and free',
                mockupEnabled: body.mockupEnabled ?? true,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating merch settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
