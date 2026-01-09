import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/merch/collections/[id] - Get single collection
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const collection = await prisma.merchCollection.findUnique({
            where: { id }
        });

        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        console.error('Error fetching collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/merch/collections/[id] - Update collection
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check if collection exists
        const existing = await prisma.merchCollection.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Update collection
        const collection = await prisma.merchCollection.update({
            where: { id },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(collection);
    } catch (error) {
        console.error('Error updating collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/merch/collections/[id] - Delete collection
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if collection exists
        const existing = await prisma.merchCollection.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Delete collection
        await prisma.merchCollection.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Collection deleted successfully' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
