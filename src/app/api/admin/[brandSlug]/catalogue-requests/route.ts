
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/[brandSlug]/catalogue-requests
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

        // Get Brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
            select: { id: true }
        });

        if (!brand) {
            return new NextResponse('Brand not found', { status: 404 });
        }

        const requests = await prisma.catalogueRequest.findMany({
            where: { brandId: brand.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('[REQ_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PATCH /api/admin/[brandSlug]/catalogue-requests
// Body: { id, status }
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ brandSlug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return new NextResponse('Missing fields', { status: 400 });
        }

        const updated = await prisma.catalogueRequest.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[REQ_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
