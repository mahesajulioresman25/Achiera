import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    const { brandSlug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const settings = await prisma.itSettings.findUnique({
            where: { brandId: brand.id },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching IT settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    const { brandSlug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const body = await request.json();

        const settings = await prisma.itSettings.upsert({
            where: { brandId: brand.id },
            update: {
                heroMode: body.heroMode,
                heroTitle: body.heroTitle,
                heroSubtitle: body.heroSubtitle,
                heroTagline: body.heroTagline,
                heroCtaLabel: body.heroCtaLabel,
                heroCtaLink: body.heroCtaLink,
                aboutTitle: body.aboutTitle,
                aboutContent: body.aboutContent,
            },
            create: {
                brandId: brand.id,
                heroMode: body.heroMode || 'SINGLE',
                heroTitle: body.heroTitle || '',
                heroSubtitle: body.heroSubtitle || '',
                heroTagline: body.heroTagline,
                heroCtaLabel: body.heroCtaLabel,
                heroCtaLink: body.heroCtaLink,
                aboutTitle: body.aboutTitle,
                aboutContent: body.aboutContent,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating IT settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
