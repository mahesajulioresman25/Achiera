
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/[brandSlug]/orders
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

        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
            select: { id: true }
        });

        if (!brand) {
            return new NextResponse('Brand not found', { status: 404 });
        }

        const orders = await prisma.order.findMany({
            where: { brandId: brand.id },
            include: {
                orderItems: true // Include OrderItems
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('[ADMIN_ORDERS]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PATCH /api/admin/[brandSlug]/orders
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

        const updated = await prisma.order.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[ADMIN_ORDER_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
