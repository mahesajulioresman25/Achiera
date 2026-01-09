import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { suggestionId, operatorId, decision, reason } = await req.json();

        if (!suggestionId || !operatorId || !decision) {
            return NextResponse.json({ error: 'suggestionId, operatorId, and decision are required' }, { status: 400 });
        }

        // 1. Record Feedback in the immutable ledger
        const feedback = await (prisma as any).suggestionFeedback.create({
            data: {
                suggestionId,
                operatorId,
                decision,
                reason
            }
        });

        // 2. Guarantee: No service calls to execution systems
        // 3. Guarantee: No mutation to suggestion drafts (read-only persistence)

        return NextResponse.json({ success: true, feedback });
    } catch (error) {
        console.error('Record Feedback Error:', error);
        return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
    }
}
