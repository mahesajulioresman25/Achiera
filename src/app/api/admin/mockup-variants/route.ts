
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const templateId = searchParams.get('templateId');

        if (!templateId) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        const variants = await prisma.mockupVariant.findMany({
            where: { templateId },
            orderBy: { orderIndex: 'asc' }
        });

        return NextResponse.json({ variants });
    } catch (error) {
        console.error('Error fetching variants:', error);
        return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            templateId, name, description,
            baseImageUrl, tintMaskUrl,
            safeZoneX, safeZoneY, safeZoneWidth, safeZoneHeight,
            backImageUrl, backSafeZoneX, backSafeZoneY, backSafeZoneWidth, backSafeZoneHeight,
            isActive
        } = body;

        if (!templateId || !name || !baseImageUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get max order index
        const lastVariant = await prisma.mockupVariant.findFirst({
            where: { templateId },
            orderBy: { orderIndex: 'desc' }
        });
        const nextOrderIndex = (lastVariant?.orderIndex ?? -1) + 1;

        const variant = await prisma.mockupVariant.create({
            data: {
                templateId,
                name,
                description,
                baseImageUrl,
                tintMaskUrl,
                safeZoneX: parseFloat(safeZoneX || 0),
                safeZoneY: parseFloat(safeZoneY || 0),
                safeZoneWidth: parseFloat(safeZoneWidth || 1),
                safeZoneHeight: parseFloat(safeZoneHeight || 1),

                // Back View Fields
                backImageUrl: backImageUrl || null,
                backSafeZoneX: backSafeZoneX !== undefined ? parseFloat(backSafeZoneX) : null,
                backSafeZoneY: backSafeZoneY !== undefined ? parseFloat(backSafeZoneY) : null,
                backSafeZoneWidth: backSafeZoneWidth !== undefined ? parseFloat(backSafeZoneWidth) : null,
                backSafeZoneHeight: backSafeZoneHeight !== undefined ? parseFloat(backSafeZoneHeight) : null,

                orderIndex: nextOrderIndex,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(variant);
    } catch (error) {
        console.error('Error creating variant:', error);
        return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
    }
}
