import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/merch/collections/[id]/products/[productId] - Update collection product
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; productId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, productId } = await params;
        const body = await req.json();

        const collectionProduct = await prisma.collectionProduct.update({
            where: {
                collectionId_productId: {
                    collectionId: id,
                    productId: productId
                }
            },
            data: {
                ...body,
                updatedAt: new Date()
            },
            include: {
                product: {
                    include: {
                        variants: true
                    }
                }
            }
        });

        return NextResponse.json(collectionProduct);
    } catch (error: any) {
        console.error('Error updating collection product:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/admin/merch/collections/[id]/products/[productId] - Remove product from collection
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; productId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, productId } = await params;

        await prisma.collectionProduct.delete({
            where: {
                collectionId_productId: {
                    collectionId: id,
                    productId: productId
                }
            }
        });

        return NextResponse.json({ message: 'Product removed from collection' });
    } catch (error) {
        console.error('Error removing product from collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
