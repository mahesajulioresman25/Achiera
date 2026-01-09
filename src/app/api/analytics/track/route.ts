import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { brandSlug, type, path, collectionSlug } = body;

        // Find brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Get user agent and IP (hashed for privacy)
        const userAgent = request.headers.get('user-agent') || undefined;
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

        // Simple hash for IP privacy
        const ipHash = ip !== 'unknown'
            ? Buffer.from(ip).toString('base64').substring(0, 16)
            : undefined;

        // Create analytics event
        await prisma.analyticsEvent.create({
            data: {
                brandId: brand.id,
                type,
                path,
                collectionSlug,
                userAgent,
                ipHash,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}
