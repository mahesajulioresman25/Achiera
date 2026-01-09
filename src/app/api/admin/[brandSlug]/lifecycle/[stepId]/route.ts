import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; stepId: string }> }
) {
    const { stepId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const step = await prisma.developmentLifecycleStep.findUnique({
            where: { id: stepId },
        });

        if (!step) {
            return NextResponse.json({ error: 'Lifecycle step not found' }, { status: 404 });
        }

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error fetching lifecycle step:', error);
        return NextResponse.json({ error: 'Failed to fetch lifecycle step' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; stepId: string }> }
) {
    const { stepId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const step = await prisma.developmentLifecycleStep.update({
            where: { id: stepId },
            data: {
                title: body.title,
                description: body.description,
                icon: body.icon,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            },
        });

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error updating lifecycle step:', error);
        return NextResponse.json({ error: 'Failed to update lifecycle step' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; stepId: string }> }
) {
    const { stepId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.developmentLifecycleStep.delete({
            where: { id: stepId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting lifecycle step:', error);
        return NextResponse.json({ error: 'Failed to delete lifecycle step' }, { status: 500 });
    }
}
