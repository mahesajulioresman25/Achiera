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

        const caseStudies = await prisma.itCaseStudy.findMany({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(caseStudies);
    } catch (error) {
        console.error('Error fetching case studies:', error);
        return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 });
    }
}

export async function POST(
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

        // Generate slug from title
        const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Get max sort order
        const maxCaseStudy = await prisma.itCaseStudy.findFirst({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'desc' },
        });

        const caseStudy = await prisma.itCaseStudy.create({
            data: {
                brandId: brand.id,
                slug,
                title: body.title,
                subtitle: body.subtitle,
                client: body.client,
                industry: body.industry,
                duration: body.duration,
                teamSize: body.teamSize,
                context: body.context,
                challenge: body.challenge,
                solution: body.solution,
                results: body.results,
                techStack: body.techStack || [],
                images: body.images || [],
                sortOrder: (maxCaseStudy?.sortOrder || 0) + 1,
                isPublished: body.isPublished !== undefined ? body.isPublished : false,
            },
        });

        return NextResponse.json(caseStudy);
    } catch (error) {
        console.error('Error creating case study:', error);
        return NextResponse.json({ error: 'Failed to create case study' }, { status: 500 });
    }
}
