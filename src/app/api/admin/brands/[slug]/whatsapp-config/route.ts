import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { WhatsAppProvider } from '@prisma/client';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { slug } = await params;

        const brand = await prisma.brand.findUnique({
            where: { slug },
            include: { brandConfig: true }
        });

        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        return NextResponse.json({
            whatsappProvider: brand.brandConfig?.whatsappProvider || 'LOCAL',
            whatsappQuikwaToken: brand.brandConfig?.whatsappQuikwaToken || '',
            whatsappQuikwaDeviceId: brand.brandConfig?.whatsappQuikwaDeviceId || '',
        });
    } catch (error) {
        console.error('Failed to fetch WA config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { slug } = await params;
        const body = await req.json();

        // 1. Get brand
        const brand = await prisma.brand.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        // 2. Update or Create BrandConfig
        await prisma.brandConfig.upsert({
            where: { brandId: brand.id },
            update: {
                whatsappProvider: body.whatsappProvider,
                whatsappQuikwaToken: body.whatsappQuikwaToken,
                whatsappQuikwaDeviceId: body.whatsappQuikwaDeviceId,
            },
            create: {
                brandId: brand.id,
                whatsappProvider: body.whatsappProvider,
                whatsappQuikwaToken: body.whatsappQuikwaToken,
                whatsappQuikwaDeviceId: body.whatsappQuikwaDeviceId,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update WA config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
