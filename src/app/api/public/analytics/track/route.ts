import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Support both single event and batch events
        const events = body.events || [body];

        if (events.length === 0) {
            return NextResponse.json(
                { error: 'No events provided' },
                { status: 400 }
            );
        }

        // Get user agent and IP for tracking
        const userAgent = request.headers.get('user-agent') || undefined;
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        const createdEvents = [];

        for (const event of events) {
            const { brandSlug, eventType, sessionId, referrer, metadata } = event;

            // Validate required fields
            if (!brandSlug || !eventType) {
                console.warn('Skipping event: missing brandSlug or eventType', event);
                continue;
            }

            // Find brand (cache this in production for better performance)
            const brand = await prisma.brand.findUnique({
                where: { slug: brandSlug },
            });

            if (!brand) {
                console.warn(`Skipping event: brand not found for slug ${brandSlug}`);
                continue;
            }

            // Create analytics event
            const createdEvent = await prisma.analyticsEvent.create({
                data: {
                    brandId: brand.id,
                    type: eventType,
                    path: metadata?.path,
                    collectionSlug: metadata?.collectionSlug,
                    sessionId: sessionId || undefined,
                    referrer: referrer || undefined,
                    metadata: metadata || undefined,
                    userAgent,
                    ipHash,
                },
            });

            createdEvents.push(createdEvent.id);
        }

        return NextResponse.json({
            success: true,
            eventIds: createdEvents,
            count: createdEvents.length
        });
    } catch (error) {
        console.error('Error tracking analytics:', error);
        // Return 200 even on error to prevent client-side console errors
        return NextResponse.json({
            success: false,
            error: 'Failed to track event'
        });
    }
}
