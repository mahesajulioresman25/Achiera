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

        const steps = await prisma.developmentLifecycleStep.findMany({
            where: {
                brandId: brand.id,
                isActive: true,
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
            },
        });

        return NextResponse.json(steps);
    } catch (error) {
        console.error('Error fetching public lifecycle steps:', error);
        return NextResponse.json({ error: 'Failed to fetch lifecycle steps' }, { status: 500 });
    }
}
