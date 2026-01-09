import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/products/[id]/variants/[variantId]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { variantId } = await params;

        const variant = await prisma.mockupVariant.findUnique({
            where: { id: variantId },
            include: {
                product: {
                    include: {
                        collection: true
                    }
                },
                mockupTemplates: true
            }
        });

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        return NextResponse.json(variant);
    } catch (error) {
        console.error('Error fetching variant:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/products/[id]/variants/[variantId]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { variantId } = await params;
        const body = await req.json();

        const variant = await prisma.mockupVariant.update({
            where: { id: variantId },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(variant);
    } catch (error: any) {
        console.error('Error updating variant:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Variant SKU already exists' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/products/[id]/variants/[variantId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { variantId } = await params;

        await prisma.mockupVariant.delete({
            where: { id: variantId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting variant:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
