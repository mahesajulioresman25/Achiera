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

        const services = await prisma.itService.findMany({
            where: {
                brandId: brand.id,
                isActive: true,
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                icon: true,
                features: true,
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error fetching public services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
