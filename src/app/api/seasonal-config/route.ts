import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seasonal-config
 * Fetch all seasonal configurations for a brand
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
        }

        const configs = await prisma.seasonalConfig.findMany({
            where: { brandId },
            orderBy: { seasonType: 'asc' }
        });

        return NextResponse.json({ success: true, data: configs });
    } catch (error) {
        console.error('[seasonal-config GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
    }
}

/**
 * PUT /api/seasonal-config
 * Update or create a seasonal configuration
 */
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { brandId, seasonType, isEnabled, customColors, customOrnamentUrl, startDateOverride, endDateOverride, promoMessage } = body;

        if (!brandId || !seasonType) {
            return NextResponse.json({ error: 'brandId and seasonType are required' }, { status: 400 });
        }

        const config = await prisma.seasonalConfig.upsert({
            where: {
                brandId_seasonType: {
                    brandId,
                    seasonType
                }
            },
            create: {
                brandId,
                seasonType,
                isEnabled: isEnabled ?? true,
                customColors,
                customOrnamentUrl,
                startDateOverride: startDateOverride ? new Date(startDateOverride) : null,
                endDateOverride: endDateOverride ? new Date(endDateOverride) : null,
                promoMessage
            },
            update: {
                isEnabled,
                customColors,
                customOrnamentUrl,
                startDateOverride: startDateOverride ? new Date(startDateOverride) : null,
                endDateOverride: endDateOverride ? new Date(endDateOverride) : null,
                promoMessage
            }
        });

        return NextResponse.json({ success: true, data: config });
    } catch (error) {
        console.error('[seasonal-config PUT] Error:', error);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}

/**
 * POST /api/seasonal-config/upload
 * Upload custom ornament image (handled separately)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // This would handle file upload logic
        // For now, return a placeholder
        return NextResponse.json({
            success: true,
            message: 'Upload endpoint ready - integrate with your file storage service'
        });
    } catch (error) {
        console.error('[seasonal-config POST] Error:', error);
        return NextResponse.json({ error: 'Failed to upload ornament' }, { status: 500 });
    }
}
