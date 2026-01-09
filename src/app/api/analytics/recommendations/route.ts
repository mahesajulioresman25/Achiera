// ACHIERA Platform - Recommendations API
// Get and interact with recommendations

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AccessContext } from '@/lib/auth/requireAccess';
import { validateBrandAccess } from '@/lib/auth/brandIsolation';
import { prisma } from '@/lib/prisma';
import { trackRecommendationInteraction } from '@/lib/analytics/event-writer';

/**
 * Get Recommendations
 * GET /api/analytics/recommendations?brandId=xxx&status=active
 */
export async function GET(request: NextRequest) {
    return withAuth(
        async (req: NextRequest, context: AccessContext) => {
            try {
                const { searchParams } = new URL(req.url);
                const brandId = searchParams.get('brandId');
                const status = searchParams.get('status') || 'active';

                if (!brandId) {
                    return NextResponse.json(
                        { error: 'brandId is required' },
                        { status: 400 }
                    );
                }

                // Validate brand access
                validateBrandAccess(context.brandId || null, brandId, context.role);

                // Get recommendations
                const recommendations = await prisma.recommendation.findMany({
                    where: {
                        brandId,
                        status,
                        expiresAt: { gt: new Date() }
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { createdAt: 'desc' }
                    ],
                    take: 50
                });

                return NextResponse.json({ recommendations });

            } catch (error) {
                return NextResponse.json(
                    {
                        error: 'Failed to fetch recommendations',
                        message: (error as Error).message
                    },
                    { status: 500 }
                );
            }
        },
        {
            permission: 'report:read'
        }
    )(request);
}

/**
 * Act on Recommendation
 * PATCH /api/analytics/recommendations/:id/act
 */
export async function PATCH(request: NextRequest) {
    return withAuth(
        async (req: NextRequest, context: AccessContext) => {
            try {
                const body = await req.json();
                const { recommendationId, action, actionTaken, dismissalReason } = body;

                // Get recommendation
                const recommendation = await prisma.recommendation.findUnique({
                    where: { id: recommendationId }
                });

                if (!recommendation) {
                    return NextResponse.json(
                        { error: 'Recommendation not found' },
                        { status: 404 }
                    );
                }

                // Validate brand access
                validateBrandAccess(
                    context.brandId || null,
                    recommendation.brandId,
                    context.role
                );

                // Update recommendation
                if (action === 'act') {
                    await prisma.recommendation.update({
                        where: { id: recommendationId },
                        data: {
                            status: 'acted_upon',
                            actedUponAt: new Date(),
                            actedUponBy: context.userId,
                            actionTaken
                        }
                    });

                    await trackRecommendationInteraction(
                        recommendation.brandId,
                        recommendationId,
                        'acted_upon',
                        context.userId,
                        { actionTaken }
                    );
                } else if (action === 'dismiss') {
                    await prisma.recommendation.update({
                        where: { id: recommendationId },
                        data: {
                            status: 'dismissed',
                            dismissedAt: new Date(),
                            dismissedBy: context.userId,
                            dismissalReason
                        }
                    });

                    await trackRecommendationInteraction(
                        recommendation.brandId,
                        recommendationId,
                        'dismissed',
                        context.userId,
                        { dismissalReason }
                    );
                }

                return NextResponse.json({ success: true });

            } catch (error) {
                return NextResponse.json(
                    {
                        error: 'Failed to update recommendation',
                        message: (error as Error).message
                    },
                    { status: 500 }
                );
            }
        },
        {
            permission: 'product:update' // Reuse product permission
        }
    )(request);
}
