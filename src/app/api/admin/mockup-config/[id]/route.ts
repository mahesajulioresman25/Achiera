import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/mockup-config/[id] - Update mockup config
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        // If setting as default, unset other defaults for this brand
        if (body.isDefaultForBuilder) {
            // Get the current config to find its brandId
            const currentConfig = await prisma.mockupConfig.findUnique({
                where: { id }
            });

            if (currentConfig) {
                await prisma.mockupConfig.updateMany({
                    where: {
                        brandId: currentConfig.brandId,
                        isDefaultForBuilder: true,
                        id: { not: id } // Don't unset the one we're updating
                    },
                    data: {
                        isDefaultForBuilder: false
                    }
                });
            }
        }

        const config = await prisma.mockupConfig.update({
            where: { id: id },
            data: {
                displayName: body.displayName,
                productType: body.productType,
                baseImages: body.baseImages,
                baseImageUrl: body.baseImageUrl,
                colorOptions: body.colorOptions,
                safeZoneX: body.safeZone?.x ?? 0,
                safeZoneY: body.safeZone?.y ?? 0,
                safeZoneWidth: body.safeZone?.width ?? 200,
                safeZoneHeight: body.safeZone?.height ?? 200,
                isActive: body.isActive,
                isDefaultForBuilder: body.isDefaultForBuilder ?? false
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating mockup config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}

// DELETE /api/admin/mockup-config/[id] - Delete mockup config
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        await prisma.mockupConfig.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting mockup config:', error);
        return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
    }
}
