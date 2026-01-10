import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    try {
        const { brandId } = await params;

        console.log('[Subscription API GET] Fetching for brandId:', brandId);

        const subscriptions = await prisma.subscription.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                plan: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        const totalCount = await (prisma as any).subscription.count();
        console.log('[Subscription API GET] Found subscriptions:', subscriptions.length, 'Total in DB:', totalCount);
        return NextResponse.json({ success: true, data: subscriptions, debug: { totalCount, brandId } });
    } catch (error: any) {
        console.error('[Subscription API GET] Error fetching subscriptions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
