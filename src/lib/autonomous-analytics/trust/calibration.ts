import { prisma } from '@/lib/prisma';

export type AgreementSignal = 'AGREE' | 'UNSURE' | 'DISAGREE';

export interface TrustGapReport {
    system_confidence_avg: number;
    human_agreement_rate: number;
    disagreement_clusters: string[];
    disagreement_clusters_full: any[];
    trust_gap_score: number; // 0-100
    red_flag: boolean;
}

export interface HumanReadinessSummary {
    trust_alignment: 'LOW' | 'MEDIUM' | 'HIGH';
    primary_concerns: string[];
    recommendation: 'CONTINUE OBSERVE' | 'EXTEND CALIBRATION';
}

/**
 * Record human agreement signal
 * CRITICAL: NO persistence to execution tables
 */
export async function recordAgreementSignal(
    decisionId: string,
    brandId: string,
    agreement: AgreementSignal,
    reason?: string
) {
    return await prisma.humanAgreementSignal.create({
        data: {
            decisionId,
            brandId,
            agreement,
            reason
        }
    });
}

/**
 * Calculate trust gap report
 * Measures deltas between System Confidence and Human Agreement
 */
export async function calculateTrustGapReport(brandId: string): Promise<TrustGapReport> {
    const signals = await prisma.humanAgreementSignal.findMany({
        where: { brandId },
        take: 100,
        orderBy: { createdAt: 'desc' }
    });

    if (signals.length === 0) {
        return {
            system_confidence_avg: 0,
            human_agreement_rate: 0,
            disagreement_clusters: [],
            disagreement_clusters_full: [],
            trust_gap_score: 0,
            red_flag: false
        };
    }

    // Fetch related execution logs to get system confidence
    const decisionIds = signals.map(s => s.decisionId);
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            decisionId: { in: decisionIds }
        } as any
    });

    let totalSystemConfidence = 0;
    let agreementCount = 0;

    signals.forEach(signal => {
        if (signal.agreement === 'AGREE') agreementCount++;

        const exec = (executions as any[]).find(e => e.decisionId === signal.decisionId);
        if (exec) {
            const meta = exec.metadata as any;
            totalSystemConfidence += meta?.confidenceScore || 0;
        }
    });

    const avgSystemConfidence = totalSystemConfidence / Math.max(executions.length, 1);
    const humanAgreementRate = agreementCount / signals.length;

    // Trust Gap = Delta between system confidence and human agreement
    const delta = Math.abs(avgSystemConfidence - humanAgreementRate);
    const trustGapScore = Math.max(0, 100 - (delta * 100));

    // Red Flag Rule: Delta > 30%
    const redFlag = delta > 0.30;

    const clusters = await analyzeDisagreementHeatmap(brandId);
    const disagreement_clusters = clusters.filter(c => c.warning_level === 'HIGH').map(c => c.domain);

    return {
        system_confidence_avg: parseFloat(avgSystemConfidence.toFixed(3)),
        human_agreement_rate: parseFloat(humanAgreementRate.toFixed(3)),
        disagreement_clusters: disagreement_clusters,
        disagreement_clusters_full: clusters,
        trust_gap_score: parseFloat(trustGapScore.toFixed(1)),
        red_flag: redFlag
    };
}

/**
 * Analyze disagreement clusters by domain and SKU
 */
export async function analyzeDisagreementHeatmap(brandId: string) {
    const signals = await prisma.humanAgreementSignal.findMany({
        where: { brandId, agreement: 'DISAGREE' },
        take: 50
    });

    const domains = ['ADS', 'INVENTORY', 'SALES', 'PRICING'];
    const clusters: any[] = [];

    for (const domain of domains) {
        // In a real system, we'd join with decisionRule to get domain
        // For now, we'll mock the domain mapping or fetch rules
        const disagreeInDomain = signals.length > 0 ? Math.random() * signals.length : 0; // Placeholder

        clusters.push({
            domain,
            count: Math.round(disagreeInDomain),
            warning_level: disagreeInDomain > 5 ? 'HIGH' : 'LOW'
        });
    }

    return clusters;
}

/**
 * Produce human-centric readiness summary
 */
export function getHumanReadinessSummary(report: TrustGapReport): HumanReadinessSummary {
    let trust_alignment: HumanReadinessSummary['trust_alignment'] = 'LOW';
    if (report.trust_gap_score > 80) trust_alignment = 'HIGH';
    else if (report.trust_gap_score > 60) trust_alignment = 'MEDIUM';

    const primary_concerns: string[] = [];
    if (report.red_flag) {
        primary_concerns.push('Significant divergence between system confidence and human judgment detected.');
    }
    if (report.human_agreement_rate < 0.70) {
        primary_concerns.push(`Operators hesitate on ${(100 - report.human_agreement_rate * 100).toFixed(0)}% of system evaluations.`);
    }

    return {
        trust_alignment,
        primary_concerns,
        recommendation: report.red_flag || report.human_agreement_rate < 0.6 ? 'EXTEND CALIBRATION' : 'CONTINUE OBSERVE'
    };
}
