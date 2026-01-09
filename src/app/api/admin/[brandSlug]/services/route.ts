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

        const services = await prisma.itService.findMany({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
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

        // Generate slug from name
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Get max sort order
        const maxService = await prisma.itService.findFirst({
            where: { brandId: brand.id },
            orderBy: { sortOrder: 'desc' },
        });

        const service = await prisma.itService.create({
            data: {
                brandId: brand.id,
                slug,
                name: body.name,
                description: body.description,
                icon: body.icon,
                features: body.features || [],
                sortOrder: (maxService?.sortOrder || 0) + 1,
                isActive: body.isActive !== undefined ? body.isActive : true,
            },
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
