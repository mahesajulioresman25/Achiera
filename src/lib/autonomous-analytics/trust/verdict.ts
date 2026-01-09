import { prisma } from '@/lib/prisma';
import { calculateTrustGapReport } from './calibration';

export interface AutonomyVerdict {
    brand_id: string;
    observation_days: number;
    system_stability: 'STABLE' | 'DEGRADING';
    human_alignment: 'HIGH' | 'MEDIUM' | 'LOW';
    ai_reliability: 'CONSISTENT' | 'VOLATILE';
    blocking_factors: string[];
    verdict: 'NOT_READY' | 'CONDITIONALLY_READY';
    recommendation: 'CONTINUE_OBSERVE' | 'EXTEND_CALIBRATION' | 'ALLOW_SUGGEST_MODE';
    issued_at: string;
}

/**
 * Issuing a governance verdict on whether the system is ready for Suggest Mode.
 * This does NOT enable Suggest Mode.
 */
export async function issueTrustVerdict(brandId: string): Promise<AutonomyVerdict> {
    // 1. Fetch Calibration Data (Human Alignment)
    const calibrationReport = await calculateTrustGapReport(brandId);

    // 2. Fetch Stability Data (Observation Days & Success Rate)
    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { createdAt: true }
    });

    const now = new Date();
    const observationDays = brand ? Math.floor((now.getTime() - new Date(brand.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const executions = await prisma.executionLog.findMany({
        where: { brandId },
        orderBy: { executedAt: 'desc' },
        take: 50
    });

    const successRate = executions.length > 0
        ? (executions.filter(e => e.status === 'SUCCESS').length / executions.length)
        : 1.0;

    // 3. Determine Blocking Factors
    const blocking_factors: string[] = [];

    if (observationDays < 7) {
        blocking_factors.push(`Observation window insufficient (Current: ${observationDays}d, Required: 7d).`);
    }

    if (calibrationReport.red_flag) {
        blocking_factors.push('Critical human-system divergence (Delta > 30%) detected in calibration.');
    }

    if (successRate < 0.95) {
        blocking_factors.push(`System instability detected (Success Rate: ${(successRate * 100).toFixed(1)}%, Target: 95%).`);
    }

    // 4. Decision Logic
    let human_alignment: AutonomyVerdict['human_alignment'] = 'LOW';
    if (calibrationReport.trust_gap_score > 85) human_alignment = 'HIGH';
    else if (calibrationReport.trust_gap_score > 70) human_alignment = 'MEDIUM';

    const system_stability: AutonomyVerdict['system_stability'] = successRate >= 0.95 ? 'STABLE' : 'DEGRADING';
    const ai_reliability: AutonomyVerdict['ai_reliability'] = successRate >= 0.90 ? 'CONSISTENT' : 'VOLATILE';

    let verdict: AutonomyVerdict['verdict'] = 'NOT_READY';
    let recommendation: AutonomyVerdict['recommendation'] = 'CONTINUE_OBSERVE';

    if (blocking_factors.length === 0 && human_alignment === 'HIGH' && system_stability === 'STABLE') {
        // Technically "Ready" but we cap the verdict to NOT enabling Suggest Mode in this code path
        // recommendation = 'ALLOW_SUGGEST_MODE'; 
        // We will keep it as CONDITIONALLY_READY or keep recommendation but ensure no UI toggles are enabled
        verdict = 'CONDITIONALLY_READY';
        recommendation = 'ALLOW_SUGGEST_MODE';
    } else if (blocking_factors.length > 0) {
        verdict = 'NOT_READY';
        recommendation = blocking_factors.some(f => f.includes('Calibration')) ? 'EXTEND_CALIBRATION' : 'CONTINUE_OBSERVE';
    }

    return {
        brand_id: brandId,
        observation_days: observationDays,
        system_stability,
        human_alignment,
        ai_reliability,
        blocking_factors,
        verdict,
        recommendation,
        issued_at: now.toISOString()
    };
}
