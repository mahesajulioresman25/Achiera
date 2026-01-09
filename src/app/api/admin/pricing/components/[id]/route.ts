import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceComponentType } from '@prisma/client';

// GET /api/admin/pricing/components/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const component = await prisma.priceComponent.findUnique({
            where: { id },
            include: { rules: true }
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(component);
    } catch (error) {
        console.error('Failed to fetch component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/pricing/components/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { name, description, type, isActive } = body;

        // Validation: Code cannot be changed

        const component = await prisma.priceComponent.update({
            where: { id },
            data: {
                name,
                description,
                type: type as PriceComponentType,
                isActive
            }
        });

        return NextResponse.json(component);
    } catch (error) {
        console.error('Failed to update component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/pricing/components/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Check for active rules before deletion?
        // For now, allow delete (with cascade if configured, or restrictive)
        // Schema has rules PriceRule[]

        await prisma.priceComponent.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete component:', error);
        return NextResponse.json(
            { error: 'Failed to delete component. It may be in use.' },
            { status: 500 }
        );
    }
}
