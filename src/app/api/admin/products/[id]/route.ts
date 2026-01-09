import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/products/[id] - Get product details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const product = await prisma.mockupProductTemplate.findUnique({
            where: { id },
            include: {
                collection: true,
                variants: {
                    orderBy: { displayOrder: 'asc' }
                },
                mockupTemplates: {
                    where: { isActive: true },
                    include: {
                        variant: true
                    }
                },
                _count: {
                    select: { variants: true, mockupTemplates: true }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const product = await prisma.mockupProductTemplate.update({
            where: { id },
            data: {
                ...body,
                updatedAt: new Date()
            },
            include: {
                variants: true,
                mockupTemplates: true
            }
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Error updating product:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Product slug or SKU already exists' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.mockupProductTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
