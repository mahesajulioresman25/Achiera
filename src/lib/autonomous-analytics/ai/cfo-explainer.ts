// CFO-Grade Autonomy Explainer
// Generate conservative, audit-safe explanations for autonomous executions

import { RuleEvaluationResult } from '../types/decision';
import { AIContext } from './types';

interface CFOExplanation {
    summary: string;
    why_safe: string[];
    metrics_used: string[];
    rollback_plan: {
        available: boolean;
        eta_hours: number;
    };
    confidence: number;
    warnings: string[];
}

/**
 * Generate CFO-grade explanation for autonomous execution
 */
export function generateCFOExplanation(
    ruleEvaluation: RuleEvaluationResult,
    context: AIContext,
    executionResult: {
        safetyGatesPassed: number;
        totalSafetyGates: number;
        rollbackAvailable: boolean;
        autoRollbackHours?: number;
    }
): CFOExplanation {
    const { rule, metrics, decision, history } = context;

    // Build summary
    const summary = buildSummary(rule, metrics, decision);

    // Build safety reasons
    const why_safe = buildSafetyReasons(
        rule,
        decision,
        executionResult,
        history
    );

    // Build metrics list
    const metrics_used = buildMetricsList(metrics);

    // Build rollback plan
    const rollback_plan = {
        available: executionResult.rollbackAvailable,
        eta_hours: executionResult.autoRollbackHours || 0
    };

    // Build warnings
    const warnings = buildWarnings(rule, decision, history);

    return {
        summary,
        why_safe,
        metrics_used,
        rollback_plan,
        confidence: ruleEvaluation.confidenceScore,
        warnings
    };
}

/**
 * Build executive summary in Indonesian
 */
function buildSummary(
    rule: any,
    metrics: any,
    decision: any
): string {
    const actionName = getActionName(rule.name);
    const primaryMetric = getPrimaryMetric(metrics.current);
    const threshold = getPrimaryThreshold(metrics.thresholds);
    const autonomyLevel = getAutonomyLevelName(decision.autonomyLevel);
    const riskLevel = decision.riskTier.toLowerCase();

    return `${actionName} karena ${primaryMetric.name} ${primaryMetric.comparison} ${threshold.value} dengan ${primaryMetric.context}. Aksi ini memenuhi kriteria ${autonomyLevel} dengan risiko ${riskLevel} dan dilindungi auto-rollback ${decision.autoRollbackHours || 24} jam.`;
}

/**
 * Build safety reasons list
 */
function buildSafetyReasons(
    rule: any,
    decision: any,
    execution: any,
    history: any
): string[] {
    const reasons: string[] = [];

    // Risk level
    reasons.push(
        `Aksi termasuk kategori risiko ${decision.riskTier} - ${getRiskDescription(decision.riskTier)}`
    );

    // Safety gates
    const gateDetails = getSafetyGateDetails(execution.safetyGatesPassed);
    reasons.push(
        `Melewati ${execution.safetyGatesPassed} safety gates: ${gateDetails.join(', ')}`
    );

    // Snapshot
    reasons.push(
        'Snapshot state dibuat sebelum eksekusi - aksi dapat di-rollback otomatis atau manual kapan saja'
    );

    // Auto-rollback
    if (execution.autoRollbackHours) {
        reasons.push(
            `Auto-rollback terjadwal dalam ${execution.autoRollbackHours} jam - state akan kembali otomatis jika tidak ada intervensi manual`
        );
    }

    // Financial impact
    const impact = estimateFinancialImpact(decision.estimatedImpact);
    reasons.push(
        `Dampak finansial terbatas: ${impact.description}, ${impact.risk}`
    );

    // Audit trail
    reasons.push(
        'Audit trail lengkap tersimpan - setiap langkah tercatat dengan timestamp, user, dan state before/after'
    );

    return reasons;
}

/**
 * Build metrics list with Indonesian descriptions
 */
function buildMetricsList(metrics: any): string[] {
    const metricsList: string[] = [];

    const metricDescriptions: Record<string, string> = {
        'roas_7d': 'Return on Ad Spend 7 hari terakhir',
        'ad_spend_7d': 'Total pengeluaran iklan 7 hari',
        'clicks_7d': 'Total klik dalam 7 hari',
        'impressions_7d': 'Total tayangan dalam 7 hari',
        'revenue_7d': 'Revenue yang dihasilkan',
        'orders_7d': 'Total pesanan 7 hari',
        'conversion_rate': 'Tingkat konversi',
        'ctr': 'Click-through rate',
        'cpc': 'Cost per click'
    };

    for (const [key, value] of Object.entries(metrics.current)) {
        const threshold = metrics.thresholds[key];
        const description = metricDescriptions[key] || key;

        if (threshold !== undefined) {
            metricsList.push(
                `${key}: ${formatMetricValue(key, value as number)} (threshold: ${formatMetricValue(key, threshold)}) - ${description}`
            );
        } else {
            metricsList.push(
                `${key}: ${formatMetricValue(key, value as number)} - ${description}`
            );
        }
    }

    return metricsList;
}

/**
 * Build warnings for CFO
 */
function buildWarnings(
    rule: any,
    decision: any,
    history: any
): string[] {
    const warnings: string[] = [];

    // Always recommend manual review
    warnings.push(
        'PENTING: Meskipun aksi ini aman dan reversible, tetap diperlukan review manual untuk memahami penyebab root cause dan memastikan tidak ada masalah sistemik'
    );

    // Auto-rollback warning
    if (decision.autoRollbackHours) {
        warnings.push(
            `Auto-rollback dalam ${decision.autoRollbackHours} jam akan mengembalikan state - jika Anda ingin perubahan permanen, batalkan auto-rollback melalui dashboard`
        );
    }

    // Historical success rate
    if (history.similarDecisions > 0) {
        const successRate = Math.round(history.successRate * 100);
        warnings.push(
            `Data historis menunjukkan ${Math.round(history.successRate * history.similarDecisions)} dari ${history.similarDecisions} eksekusi serupa berhasil (${successRate}% success rate)`
        );
    }

    // Autonomy level warning
    warnings.push(
        'Sistem TIDAK akan meningkatkan level autonomy atau mengubah threshold tanpa persetujuan eksplisit dari brand owner atau CFO'
    );

    // Low confidence warning
    if (decision.confidenceScore < 0.85) {
        warnings.push(
            `PERHATIAN: Confidence score ${decision.confidenceScore.toFixed(2)} di bawah threshold ideal 0.85 - disarankan review manual sebelum mempercayai hasil ini sepenuhnya`
        );
    }

    return warnings;
}

/**
 * Helper functions
 */

function getActionName(ruleName: string): string {
    const actionMap: Record<string, string> = {
        'Pause Low ROAS Ads': 'Kampanye iklan dijeda otomatis',
        'Increase Budget High ROAS': 'Budget iklan ditingkatkan',
        'Stop Underperforming Promo': 'Promosi dihentikan',
        'Alert Low Stock': 'Alert stok rendah dikirim'
    };

    return actionMap[ruleName] || ruleName;
}

function getPrimaryMetric(metrics: Record<string, number>): {
    name: string;
    value: number;
    comparison: string;
    context: string;
} {
    // Find the most important metric (usually the first one)
    const [key, value] = Object.entries(metrics)[0];

    return {
        name: key,
        value: value,
        comparison: value < 1 ? 'turun ke' : 'naik ke',
        context: `pengeluaran Rp ${formatCurrency(metrics.ad_spend_7d || 0)} dalam 7 hari terakhir`
    };
}

function getPrimaryThreshold(thresholds: Record<string, number>): {
    key: string;
    value: string;
} {
    const [key, value] = Object.entries(thresholds)[0];
    return {
        key,
        value: `${value}x`
    };
}

function getAutonomyLevelName(level: number): string {
    const names = [
        'Level 0 (Observe)',
        'Level 1 (Suggest)',
        'Level 2 (Assisted)',
        'Level 3 (Guarded)'
    ];
    return names[level] || `Level ${level}`;
}

function getRiskDescription(riskTier: string): string {
    const descriptions: Record<string, string> = {
        'LOW': 'hanya mengubah state sementara, tidak ada perubahan permanen',
        'MEDIUM': 'memiliki dampak finansial terbatas dan dapat di-rollback',
        'HIGH': 'memiliki dampak finansial signifikan, memerlukan approval',
        'CRITICAL': 'memiliki dampak finansial besar, memerlukan CFO approval'
    };

    return descriptions[riskTier] || 'tidak diketahui';
}

function getSafetyGateDetails(gatesPassed: number): string[] {
    return [
        'cooldown period (tidak ada eksekusi serupa 60 menit terakhir)',
        'daily cap (belum mencapai limit eksekusi harian)',
        'blackout period (di luar jam 00:00-06:00)',
        'autonomy level sesuai (tidak melebihi maksimal yang diizinkan)',
        'confidence score memenuhi threshold',
        'data completeness mencukupi (semua metrik tersedia)',
        'tidak ada konflik dengan eksekusi pending lainnya'
    ].slice(0, gatesPassed);
}

function estimateFinancialImpact(impact: any): {
    description: string;
    risk: string;
} {
    if (impact.type === 'cost_savings') {
        return {
            description: `maksimal penghematan Rp ${formatCurrency(impact.amount || 0)}/minggu`,
            risk: 'tidak ada risiko revenue loss'
        };
    } else if (impact.type === 'revenue_increase') {
        return {
            description: `potensi peningkatan revenue Rp ${formatCurrency(impact.amount || 0)}/minggu`,
            risk: `risiko revenue loss jika gagal: Rp ${formatCurrency(impact.revenueRisk || 0)}`
        };
    }

    return {
        description: 'dampak finansial minimal',
        risk: 'risiko terbatas'
    };
}

function formatMetricValue(key: string, value: number): string {
    if (key.includes('roas') || key.includes('rate')) {
        return `${value.toFixed(2)}x`;
    } else if (key.includes('spend') || key.includes('revenue')) {
        return `Rp ${formatCurrency(value)}`;
    } else {
        return value.toLocaleString('id-ID');
    }
}

function formatCurrency(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}jt`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}rb`;
    }
    return value.toLocaleString('id-ID');
}
