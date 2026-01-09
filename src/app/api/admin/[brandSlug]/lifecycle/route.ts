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

        const steps = await prisma.developmentLifecycleStep.findMany({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(steps);
    } catch (error) {
        console.error('Error fetching lifecycle steps:', error);
        return NextResponse.json({ error: 'Failed to fetch lifecycle steps' }, { status: 500 });
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

        // Get max sort order
        const maxStep = await prisma.developmentLifecycleStep.findFirst({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'desc' },
        });

        const step = await prisma.developmentLifecycleStep.create({
            data: {
                brandId: brand.id,
                title: body.title,
                description: body.description,
                icon: body.icon,
                sortOrder: (maxStep?.sortOrder || 0) + 1,
                isActive: body.isActive !== undefined ? body.isActive : true,
            },
        });

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error creating lifecycle step:', error);
        return NextResponse.json({ error: 'Failed to create lifecycle step' }, { status: 500 });
    }
}
