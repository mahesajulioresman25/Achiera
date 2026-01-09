import { prisma } from '@/lib/prisma';
import { calculateTrustMetrics, TrustMetrics } from './trust-metrics';
import { RiskLevel } from '../types/decision';

export interface TrustTrendSnapshot {
    period: '7d' | '14d' | '30d';
    rule_acceptance: number;
    ai_agreement: number;
    rollback_rate: number;
    manual_override_rate: number;
    avg_confidence: number;
    safety_gate_failures: number;
}

export interface AutonomyReadiness {
    score: number;
    status: 'NOT_READY' | 'CONDITIONAL' | 'READY_FOR_REVIEW';
    blocking_factors: string[];
    computed_at: string; // ISODate
}

export interface RiskCluster {
    domain: string;
    concentration_pct: number;
    top_rules: string[];
    warning_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Calculate trend snapshot for a given window
 */
export async function calculateTrustTrendSnapshot(
    brandId: string,
    period: '7d' | '14d' | '30d'
): Promise<TrustTrendSnapshot> {
    const windowDays = parseInt(period.replace('d', ''));
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - windowDays);

    const metrics = await calculateTrustMetrics(brandId, startDate, endDate);

    // Fetch extra data for Phase 2 (avg_confidence, safety_gate_failures)
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            executedAt: { gte: startDate, lt: endDate }
        }
    });

    let totalConfidence = 0;
    let failedGates = 0;

    executions.forEach(exec => {
        const meta = exec.metadata as any;
        if (meta?.confidenceScore) totalConfidence += meta.confidenceScore;

        // Count failure if status reflects a block or failed gate
        if (exec.status === 'BLOCKED' || (meta?.safetyGateResults && meta.safetyGateResults.some((g: any) => !g.passed))) {
            failedGates++;
        }
    });

    const avgConfidence = executions.length > 0 ? totalConfidence / executions.length : 0;
    const gateFailureRate = executions.length > 0 ? failedGates / executions.length : 0;

    return {
        period,
        rule_acceptance: metrics.rule_acceptance_rate,
        ai_agreement: metrics.ai_agreement_rate,
        rollback_rate: metrics.rollback_frequency,
        manual_override_rate: metrics.manual_override_rate,
        avg_confidence: parseFloat(avgConfidence.toFixed(3)),
        safety_gate_failures: parseFloat(gateFailureRate.toFixed(3))
    };
}

/**
 * Compute readiness score (0-100) based on trend snapshot
 */
export function calculateAutonomyReadiness(
    brandId: string,
    snapshot: TrustTrendSnapshot,
    isTrendDegrading: boolean = false
): AutonomyReadiness {
    const blocking_factors: string[] = [];

    // Weights:
    // Rule Acceptance: 25%
    // AI Agreement: 25%
    // Confidence Stability: 20%
    // Rollback Suppression: 20%
    // Safety Gate Reliability: 10%

    let score = (snapshot.rule_acceptance * 25) +
        (snapshot.ai_agreement * 25) +
        (snapshot.avg_confidence * 20) +
        ((1 - snapshot.rollback_rate) * 20) +
        ((1 - snapshot.safety_gate_failures) * 10);

    // Hard Rules
    if (isTrendDegrading) {
        score = Math.min(score, 60);
        blocking_factors.push('Systemic trust trend is degrading');
    }

    if (snapshot.rollback_rate > 0.02) {
        score = Math.min(score, 40);
        blocking_factors.push(`Rollback rate (${(snapshot.rollback_rate * 100).toFixed(1)}%) exceeds 2% risk threshold`);
    }

    if (snapshot.avg_confidence < 0.85) {
        score = Math.min(score, 50); // Capped below review threshold
        blocking_factors.push(`Average confidence score (${snapshot.avg_confidence}) is below 0.85 requirement`);
    }

    if (snapshot.rule_acceptance < 0.80) {
        blocking_factors.push(`Rule acceptance rate (${(snapshot.rule_acceptance * 100).toFixed(0)}%) is too low`);
    }

    let status: AutonomyReadiness['status'] = 'NOT_READY';
    if (score >= 85 && blocking_factors.length === 0) {
        status = 'READY_FOR_REVIEW';
    } else if (score >= 60) {
        status = 'CONDITIONAL';
    }

    return {
        score: parseFloat(score.toFixed(1)),
        status,
        blocking_factors,
        computed_at: new Date().toISOString()
    };
}

/**
 * Detect risk clusters hidden behind averages
 */
export async function analyzeRiskConcentration(brandId: string): Promise<RiskCluster[]> {
    const rules = await prisma.decisionRule.findMany({
        where: { brandId },
        include: { executions: { take: 50, orderBy: { executedAt: 'desc' } } }
    });

    const domains = ['ADS', 'INVENTORY', 'SALES', 'PRICING'];
    const clusters: RiskCluster[] = [];

    domains.forEach(domain => {
        const domainRules = rules.filter(r => r.domain === domain || (r.category === domain));
        if (domainRules.length === 0) return;

        const triggeredResults = domainRules.flatMap(r => r.executions);
        const failCount = triggeredResults.filter(e => e.status === 'FAILED' || e.status === 'BLOCKED').length;

        const concentration_pct = triggeredResults.length > 0 ? failCount / triggeredResults.length : 0;

        let warning_level: RiskCluster['warning_level'] = 'LOW';
        if (concentration_pct > 0.25) warning_level = 'HIGH';
        else if (concentration_pct > 0.1) warning_level = 'MEDIUM';

        clusters.push({
            domain,
            concentration_pct: parseFloat(concentration_pct.toFixed(3)),
            top_rules: domainRules.slice(0, 3).map(r => r.name),
            warning_level
        });
    });

    return clusters;
}
