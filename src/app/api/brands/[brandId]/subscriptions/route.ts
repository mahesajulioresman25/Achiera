import { NextRequest, NextResponse } from 'next/server';
import { prisma, unisolatedPrisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    try {
        const { brandId } = await params;


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

        const totalCount = await unisolatedPrisma.subscription.count({ where: { brandId } });
        return NextResponse.json({ success: true, data: subscriptions });
    } catch (error: any) {
        console.error('[Subscription API GET] Error fetching subscriptions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
