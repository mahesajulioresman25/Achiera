import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; slug: string }> }
) {
    const { brandSlug, slug } = await params;
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: params.brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const caseStudy = await prisma.itCaseStudy.findUnique({
            where: {
                brandId_slug: {
                    brandId: brand.id,
                    slug: params.slug,
                },
            },
        });

        if (!caseStudy || !caseStudy.isPublished) {
            return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
        }

        return NextResponse.json(caseStudy);
    } catch (error) {
        console.error('Error fetching public case study:', error);
        return NextResponse.json({ error: 'Failed to fetch case study' }, { status: 500 });
    }
}
