import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/collections - List all collections
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const brandSlug = searchParams.get('brandSlug') || 'merch';

        // Get brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Get collections with product count
        const collections = await prisma.merchCollection.findMany({
            where: { brandId: brand.id },
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        return NextResponse.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/collections - Create new collection
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        // Whitelist fields to prevent schema mismatch
        const {
            brandSlug,
            name,
            slug,
            description,
            heroTitle,
            heroSubtitle,
            visibility,
            displayOrder,
            coverImage
        } = body;

        // Get brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug || 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Create collection
        const collection = await prisma.merchCollection.create({
            data: {
                brandId: brand.id,
                name,
                slug,
                description,
                coverImage,
                heroTitle: heroTitle || '',
                heroSubtitle: heroSubtitle || '',
                visibility: visibility || 'draft',
                // Default others
                status: 'active',
                displayOrder: displayOrder || 0,
                // Initialize JSON fields as empty arrays to match schema expectation if needed, or leave optional?
                // Schema has optional Json? so undefined is fine.
            }
        });

        return NextResponse.json(collection, { status: 201 });
    } catch (error: any) {
        console.error('Error creating collection:', error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Collection slug already exists' }, { status: 400 });
        }

        // Return actual error message for debugging
        return NextResponse.json({
            error: error.message || 'Internal server error',
            details: error
        }, { status: 500 });
    }
}
