
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/[brandSlug]/products
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { brandSlug } = await params;

        // 1. Get Brand ID
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
            select: { id: true }
        });

        if (!brand) {
            return new NextResponse('Brand not found', { status: 404 });
        }

        // 2. Fetch Products filtered by Brand
        const products = await prisma.mockupProductTemplate.findMany({
            where: {
                brandId: brand.id
            },
            include: {
                variants: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { variants: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform for frontend
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.displayName,
            slug: p.slug,
            productType: p.productType,
            status: 'active', // MockupProductTemplate doesn't have status field
            variantCount: p._count.variants,
            hasVariants: p.hasVariants
        }));

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error('[PRODUCTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/[brandSlug]/products
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { brandSlug } = await params;
        const body = await req.json();
        const { displayName, slug, productType, brandId: bodyBrandId } = body;

        if (!displayName || !slug) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Verify Brand
        const brandCheck = await prisma.brand.findUnique({ where: { slug: brandSlug } });
        if (!brandCheck) return new NextResponse('Brand not found', { status: 404 });

        // Create Product
        const product = await prisma.mockupProductTemplate.create({
            data: {
                brandId: brandCheck.id,
                slug,
                displayName,
                productType: productType || 'merchandise',
                hasVariants: true
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('[PRODUCTS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
