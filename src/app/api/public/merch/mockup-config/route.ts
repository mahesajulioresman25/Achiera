import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/merch/mockup-config - Get mockup builder configuration
export async function GET(req: NextRequest) {
    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Fetch active mockup configs
        const configs = await prisma.mockupConfig.findMany({
            where: {
                brandId: brand.id,
                isActive: true
            },
            select: {
                id: true,
                productType: true,
                displayName: true,
                baseImages: true
            }
        });

        return NextResponse.json({
            enabled: configs.length > 0,
            templates: configs,
            maxLogoSize: 500, // KB
            allowedFormats: ['png', 'jpg', 'jpeg']
        });
    } catch (error) {
        console.error('Error fetching mockup config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
