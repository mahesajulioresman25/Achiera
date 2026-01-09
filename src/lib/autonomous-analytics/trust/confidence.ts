import { prisma } from '@/lib/prisma';

export interface ConfidenceDimensions {
    operational: number; // 30%
    risk: number;        // 30%
    explainability: number; // 20%
    psychological: number; // 20%
}

export interface ExecutiveConfidenceReport {
    brand_id: string;
    aggregated_score: number;
    dimensions: ConfidenceDimensions;
    status: 'CRITICAL' | 'CAUTION' | 'ALIGNED' | 'PENDING';
    is_governance_frozen: boolean;
    reviews_count: number;
    last_updated: string;
    statement: string;
}

/**
 * Calculates aggregated executive confidence.
 * ZERO AI DECISION POWER - Deterministic aggregation only.
 */
export async function calculateExecutiveConfidence(brandId: string): Promise<ExecutiveConfidenceReport> {
    const reviews = await (prisma as any).executiveConfidenceReview.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' }
    });

    const statement = "Executive confidence does not equal system permission.";

    if (reviews.length === 0) {
        return {
            brand_id: brandId,
            aggregated_score: 0,
            dimensions: { operational: 0, risk: 0, explainability: 0, psychological: 0 },
            status: 'PENDING',
            is_governance_frozen: false,
            reviews_count: 0,
            last_updated: new Date().toISOString(),
            statement
        };
    }

    // Latest review from each role
    const roles = ['CFO', 'BOARD', 'OPERATOR'];
    const latestReviews = roles.map(role => reviews.find((r: any) => r.reviewerRole === role)).filter(Boolean);

    const dims: ConfidenceDimensions = {
        operational: 0,
        risk: 0,
        explainability: 0,
        psychological: 0
    };

    latestReviews.forEach((r: any) => {
        const d = r.dimensions as any;
        dims.operational += d.operational;
        dims.risk += d.risk;
        dims.explainability += d.explainability;
        dims.psychological += d.psychological;
    });

    const count = latestReviews.length;
    dims.operational /= count;
    dims.risk /= count;
    dims.explainability /= count;
    dims.psychological /= count;

    // Weighted Score
    const aggregated_score = (
        (dims.operational * 0.3) +
        (dims.risk * 0.3) +
        (dims.explainability * 0.2) +
        (dims.psychological * 0.2)
    );

    // Block Conditions
    // 1. Any individual dimension in any latest review < 30 triggers GOVERNANCE_FREEZE
    const hasCriticalDimension = latestReviews.some((r: any) =>
        Object.values(r.dimensions as any).some((v: any) => v < 30)
    );
    const is_governance_frozen = hasCriticalDimension;

    let status: ExecutiveConfidenceReport['status'] = 'CAUTION';
    if (aggregated_score >= 85 && count >= 2) status = 'ALIGNED';
    else if (aggregated_score < 40 || is_governance_frozen) status = 'CRITICAL';

    return {
        brand_id: brandId,
        aggregated_score: Math.round(aggregated_score),
        dimensions: {
            operational: Math.round(dims.operational),
            risk: Math.round(dims.risk),
            explainability: Math.round(dims.explainability),
            psychological: Math.round(dims.psychological)
        },
        status,
        is_governance_frozen,
        reviews_count: reviews.length,
        last_updated: latestReviews[0].createdAt.toISOString(),
        statement
    };
}
