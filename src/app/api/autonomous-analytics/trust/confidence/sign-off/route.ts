import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandId, reviewerRole, dimensions, comments } = body;

        if (!brandId || !reviewerRole || !dimensions) {
            return NextResponse.json({ error: 'brandId, reviewerRole, and dimensions are required' }, { status: 400 });
        }

        // ZERO AI DECISION POWER - Direct persistence of executive sentiment
        const review = await (prisma as any).executiveConfidenceReview.create({
            data: {
                brandId,
                reviewerRole,
                dimensions,
                comments
            }
        });

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Confidence Sign-off Error:', error);
        return NextResponse.json({ error: 'Failed to record confidence review' }, { status: 500 });
    }
}
