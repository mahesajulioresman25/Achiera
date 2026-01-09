import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/mockup-config - List all mockup configs
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const configs = await prisma.mockupConfig.findMany({
            orderBy: { displayName: 'asc' }
        });

        // Transform safeZone fields to object for backward compatibility
        const transformedConfigs = configs.map(config => ({
            ...config,
            safeZone: {
                x: config.safeZoneX,
                y: config.safeZoneY,
                width: config.safeZoneWidth,
                height: config.safeZoneHeight
            }
        }));

        return NextResponse.json(transformedConfigs);
    } catch (error) {
        console.error('Error fetching mockup configs:', error);
        return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
    }
}

// POST /api/admin/mockup-config - Create new mockup config
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // If setting as default, unset other defaults for this brand
        if (body.isDefaultForBuilder) {
            const brand = await prisma.brand.findFirst({
                where: { slug: 'merch' } // You might want to get brandId from body or session
            });

            if (brand) {
                await prisma.mockupConfig.updateMany({
                    where: {
                        brandId: brand.id,
                        isDefaultForBuilder: true
                    },
                    data: {
                        isDefaultForBuilder: false
                    }
                });
            }
        }

        // Get brandId (hardcoded to 'merch' for now, should come from body or session)
        const brand = await prisma.brand.findFirst({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const config = await prisma.mockupConfig.create({
            data: {
                brandId: brand.id,
                displayName: body.displayName,
                productType: body.productType,
                baseImages: body.baseImages,
                baseImageUrl: body.baseImageUrl,
                colorOptions: body.colorOptions,
                safeZoneX: body.safeZone?.x ?? 0,
                safeZoneY: body.safeZone?.y ?? 0,
                safeZoneWidth: body.safeZone?.width ?? 200,
                safeZoneHeight: body.safeZone?.height ?? 200,
                isActive: body.isActive ?? true,
                isDefaultForBuilder: body.isDefaultForBuilder ?? false
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error creating mockup config:', error);
        return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
    }
}
