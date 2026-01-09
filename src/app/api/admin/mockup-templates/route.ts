
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug');

        if (!brandSlug) {
            return NextResponse.json({ error: 'Brand slug is required' }, { status: 400 });
        }

        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const templates = await prisma.mockupProductTemplate.findMany({
            where: { brandId: brand.id },
            include: {
                _count: {
                    select: { variants: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format response to be cleaner
        const formattedTemplates = templates.map(t => ({
            ...t,
            variantCount: t._count.variants
        }));

        return NextResponse.json({ templates: formattedTemplates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandSlug, slug, displayName, productType, canvasWidth, canvasHeight, hasVariants } = body;

        if (!brandSlug || !slug || !displayName || !productType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Check if slug exists
        const existing = await prisma.mockupProductTemplate.findUnique({
            where: { slug: slug }
        });

        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }

        const template = await prisma.mockupProductTemplate.create({
            data: {
                brandId: brand.id,
                slug,
                displayName,
                productType,
                canvasWidth: canvasWidth || 2000,
                canvasHeight: canvasHeight || 2000,
                hasVariants: hasVariants ?? true,
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
