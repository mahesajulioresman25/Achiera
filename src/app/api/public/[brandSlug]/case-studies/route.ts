import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    const { brandSlug } = await params;
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: params.brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const caseStudies = await prisma.itCaseStudy.findMany({
            where: {
                brandId: brand.id,
                isPublished: true,
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                title: true,
                subtitle: true,
                client: true,
                industry: true,
                images: true,
            },
        });

        return NextResponse.json(caseStudies);
    } catch (error) {
        console.error('Error fetching public case studies:', error);
        return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 });
    }
}
