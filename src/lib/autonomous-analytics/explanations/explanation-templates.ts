// Explanation Templates - Deterministic text generation
// CRITICAL: No AI, pure template-based generation

import { MetricComparison, FinancialImpact, RiskAssessment } from './explanation-types';

/**
 * Generate trigger reason in Indonesian
 */
export function generateTriggerReason(
    ruleName: string,
    metrics: MetricComparison[]
): string {
    const primaryMetric = metrics[0];

    if (!primaryMetric) {
        return `Rule "${ruleName}" triggered berdasarkan kondisi sistem`;
    }

    const comparisonText = getComparisonText(primaryMetric.comparison);

    return `Rule "${ruleName}" triggered karena ${primaryMetric.metric_name} ${comparisonText} ${primaryMetric.formatted_threshold} (nilai saat ini: ${primaryMetric.formatted_current})`;
}

/**
 * Get comparison text in Indonesian
 */
function getComparisonText(comparison: string): string {
    const texts: Record<string, string> = {
        '<': 'turun di bawah',
        '<=': 'turun hingga atau di bawah',
        '=': 'sama dengan',
        '>=': 'naik hingga atau di atas',
        '>': 'naik di atas'
    };

    return texts[comparison] || 'memenuhi kondisi';
}

/**
 * Generate financial impact description
 */
export function generateFinancialImpactDescription(
    impact: FinancialImpact
): string {
    const typeDescriptions: Record<string, string> = {
        'cost_savings': 'penghematan biaya',
        'revenue_increase': 'peningkatan revenue',
        'risk_reduction': 'pengurangan risiko',
        'neutral': 'dampak netral'
    };

    const periodDescriptions: Record<string, string> = {
        'daily': 'per hari',
        'weekly': 'per minggu',
        'monthly': 'per bulan'
    };

    const type = typeDescriptions[impact.type] || impact.type;
    const period = periodDescriptions[impact.time_period] || impact.time_period;
    const amount = formatCurrency(impact.estimated_amount_idr);

    if (impact.type === 'neutral') {
        return `Aksi ini memiliki dampak finansial minimal`;
    }

    return `Estimasi ${type} sebesar ${amount} ${period} (confidence: ${impact.confidence})`;
}

/**
 * Generate risk factors list
 */
export function generateRiskFactors(
    assessment: RiskAssessment
): string[] {
    const factors: string[] = [];

    // Risk tier description
    const tierDescriptions: Record<string, string> = {
        'LOW': 'Risiko rendah - dampak terbatas dan mudah di-rollback',
        'MEDIUM': 'Risiko menengah - memerlukan monitoring aktif',
        'HIGH': 'Risiko tinggi - memerlukan approval dan monitoring ketat',
        'CRITICAL': 'Risiko kritis - memerlukan CFO approval'
    };

    factors.push(tierDescriptions[assessment.risk_tier]);

    // Add specific risk factors
    factors.push(...assessment.risk_factors);

    // Reversibility
    if (assessment.reversible) {
        factors.push('Aksi dapat di-rollback jika diperlukan');
    } else {
        factors.push('⚠️ PERHATIAN: Aksi ini tidak dapat di-rollback secara otomatis');
    }

    // Mitigation
    if (assessment.mitigation_available) {
        factors.push('Mitigasi risiko tersedia');
    }

    return factors;
}

/**
 * Generate safety gate summary
 */
export function generateSafetyGateSummary(
    totalGates: number,
    gatesPassed: number,
    gatesFailed: number
): string {
    if (gatesFailed === 0) {
        return `Semua ${totalGates} safety gates passed - aksi aman untuk dieksekusi`;
    }

    return `${gatesPassed} dari ${totalGates} safety gates passed. ${gatesFailed} gates memblokir eksekusi.`;
}

/**
 * Generate rollback description
 */
export function generateRollbackDescription(
    available: boolean,
    autoRollbackHours: number | null,
    manualAvailable: boolean
): string {
    if (!available) {
        return 'Rollback tidak tersedia untuk aksi ini';
    }

    const parts: string[] = ['Rollback tersedia'];

    if (autoRollbackHours) {
        parts.push(`Auto-rollback dalam ${autoRollbackHours} jam`);
    }

    if (manualAvailable) {
        parts.push('Manual rollback dapat dilakukan kapan saja');
    }

    return parts.join('. ') + '.';
}

/**
 * Generate approval requirement description
 */
export function generateApprovalDescription(
    required: boolean,
    requiredRole: string | null,
    autonomyLevel: number,
    canAutoExecute: boolean
): string {
    if (!required && canAutoExecute) {
        return `Level ${autonomyLevel} - Dapat dieksekusi otomatis tanpa approval`;
    }

    if (required && requiredRole) {
        return `Memerlukan approval dari ${requiredRole} sebelum eksekusi`;
    }

    return `Level ${autonomyLevel} - Review manual diperlukan`;
}

/**
 * Format currency in IDR
 */
function formatCurrency(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    } else if (amount >= 1_000) {
        return `Rp ${(amount / 1_000).toFixed(0)}rb`;
    }

    return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Format metric value
 */
export function formatMetricValue(
    metricName: string,
    value: number
): string {
    // ROAS, rates, percentages
    if (metricName.includes('roas') ||
        metricName.includes('rate') ||
        metricName.includes('ratio')) {
        return `${value.toFixed(2)}x`;
    }

    // Currency values
    if (metricName.includes('spend') ||
        metricName.includes('revenue') ||
        metricName.includes('cost')) {
        return formatCurrency(value);
    }

    // Percentages
    if (metricName.includes('percent') || metricName.includes('pct')) {
        return `${value.toFixed(1)}%`;
    }

    // Default: number with thousand separator
    return value.toLocaleString('id-ID');
}
