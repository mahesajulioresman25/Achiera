import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/merch/collections - List all collections
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get brandSlug from query params, default to 'merch'
        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug') || 'merch';

        // Get brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Fetch all collections
        const collections = await prisma.merchCollection.findMany({
            where: { brandId: brand.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/merch/collections - Create new collection
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, heroTitle, heroSubtitle, slug, brandSlug } = body;

        // Get brand (use brandSlug from body, default to 'merch')
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug || 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Generate slug if not provided
        const collectionSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Check if slug already exists
        const existing = await prisma.merchCollection.findFirst({
            where: {
                brandId: brand.id,
                slug: collectionSlug
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Collection with this slug already exists' }, { status: 400 });
        }

        // Create collection with default empty arrays
        const collection = await prisma.merchCollection.create({
            data: {
                brandId: brand.id,
                slug: collectionSlug,
                name,
                heroTitle,
                heroSubtitle,
                highlights: [],
                whatsInside: [],
                designOptions: [],
                materialPoints: [],
                useCases: [],
                packagingOptions: [],
                faq: [],
                galleryImages: []
            }
        });

        return NextResponse.json(collection, { status: 201 });
    } catch (error) {
        console.error('Error creating collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
