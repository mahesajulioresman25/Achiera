
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const body = await req.json();

        const {
            name, description,
            baseImageUrl, tintMaskUrl,
            safeZoneX, safeZoneY, safeZoneWidth, safeZoneHeight,
            backImageUrl, backSafeZoneX, backSafeZoneY, backSafeZoneWidth, backSafeZoneHeight,
            isActive, orderIndex
        } = body;

        const variant = await prisma.mockupVariant.update({
            where: { id },
            data: {
                name,
                description,
                baseImageUrl,
                tintMaskUrl,
                safeZoneX: safeZoneX !== undefined ? parseFloat(safeZoneX) : undefined,
                safeZoneY: safeZoneY !== undefined ? parseFloat(safeZoneY) : undefined,
                safeZoneWidth: safeZoneWidth !== undefined ? parseFloat(safeZoneWidth) : undefined,
                safeZoneHeight: safeZoneHeight !== undefined ? parseFloat(safeZoneHeight) : undefined,

                backImageUrl: backImageUrl, // Allow null
                backSafeZoneX: backSafeZoneX !== undefined ? (backSafeZoneX === null ? null : parseFloat(backSafeZoneX)) : undefined,
                backSafeZoneY: backSafeZoneY !== undefined ? (backSafeZoneY === null ? null : parseFloat(backSafeZoneY)) : undefined,
                backSafeZoneWidth: backSafeZoneWidth !== undefined ? (backSafeZoneWidth === null ? null : parseFloat(backSafeZoneWidth)) : undefined,
                backSafeZoneHeight: backSafeZoneHeight !== undefined ? (backSafeZoneHeight === null ? null : parseFloat(backSafeZoneHeight)) : undefined,

                isActive,
                orderIndex
            }
        });

        return NextResponse.json(variant);
    } catch (error) {
        console.error('Error updating variant:', error);
        return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        await prisma.mockupVariant.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting variant:', error);
        return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
    }
}
