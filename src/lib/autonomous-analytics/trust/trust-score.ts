// Trust Score - Aggregate trust metrics into single score
// CRITICAL: Deterministic, transparent calculation

import { TrustMetrics } from './trust-metrics';

/**
 * Trust score breakdown
 */
export interface TrustScore {
    // Overall trust score (0-100)
    overall_score: number;

    // Component scores
    components: {
        rule_acceptance: number;    // 0-100
        ai_alignment: number;        // 0-100
        stability: number;           // 0-100
        forecast_accuracy: number;   // 0-100
    };

    // Weights used
    weights: {
        rule_acceptance: number;
        ai_alignment: number;
        stability: number;
        forecast_accuracy: number;
    };

    // Trust level
    trust_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

    // Recommendation
    recommendation: 'pause' | 'review' | 'continue' | 'expand';
}

/**
 * Calculate trust score from metrics
 */
export function calculateTrustScore(metrics: TrustMetrics): TrustScore {
    // Component scores (0-100)
    const ruleAcceptance = metrics.rule_acceptance_rate * 100;
    const aiAlignment = metrics.ai_agreement_rate * 100;

    // Stability = inverse of rollback frequency
    const stability = (1 - metrics.rollback_frequency) * 100;

    const forecastAccuracy = metrics.forecast_accuracy * 100;

    // Weights (must sum to 1.0)
    const weights = {
        rule_acceptance: 0.35,  // Most important - human trust
        ai_alignment: 0.20,     // AI quality indicator
        stability: 0.30,        // System reliability
        forecast_accuracy: 0.15 // Prediction quality
    };

    // Calculate weighted average
    const overallScore =
        ruleAcceptance * weights.rule_acceptance +
        aiAlignment * weights.ai_alignment +
        stability * weights.stability +
        forecastAccuracy * weights.forecast_accuracy;

    // Determine trust level
    const trustLevel = determineTrustLevel(overallScore);

    // Determine recommendation
    const recommendation = determineRecommendation(overallScore, metrics);

    return {
        overall_score: parseFloat(overallScore.toFixed(1)),
        components: {
            rule_acceptance: parseFloat(ruleAcceptance.toFixed(1)),
            ai_alignment: parseFloat(aiAlignment.toFixed(1)),
            stability: parseFloat(stability.toFixed(1)),
            forecast_accuracy: parseFloat(forecastAccuracy.toFixed(1))
        },
        weights,
        trust_level: trustLevel,
        recommendation
    };
}

/**
 * Determine trust level from score
 */
function determineTrustLevel(score: number): TrustScore['trust_level'] {
    if (score >= 85) return 'very_high';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'very_low';
}

/**
 * Determine recommendation based on score and metrics
 */
function determineRecommendation(
    score: number,
    metrics: TrustMetrics
): TrustScore['recommendation'] {
    // PAUSE if critical issues
    if (score < 30 || metrics.rollback_frequency > 0.30) {
        return 'pause';
    }

    // REVIEW if moderate concerns
    if (score < 50 ||
        metrics.rule_acceptance_rate < 0.60 ||
        metrics.rollback_frequency > 0.15) {
        return 'review';
    }

    // EXPAND if very high trust
    if (score >= 85 &&
        metrics.rule_acceptance_rate >= 0.85 &&
        metrics.rollback_frequency < 0.05) {
        return 'expand';
    }

    // CONTINUE otherwise
    return 'continue';
}

/**
 * Get trust score interpretation
 */
export function getTrustScoreInterpretation(score: TrustScore): {
    summary: string;
    details: string[];
    next_steps: string[];
} {
    const summaries: Record<TrustScore['trust_level'], string> = {
        'very_high': 'Sistem sangat dipercaya - performa excellent',
        'high': 'Sistem dipercaya - performa baik',
        'medium': 'Sistem cukup dipercaya - perlu monitoring',
        'low': 'Sistem kurang dipercaya - review diperlukan',
        'very_low': 'Sistem tidak dipercaya - pause dan investigasi'
    };

    const details: string[] = [];

    // Rule acceptance analysis
    if (score.components.rule_acceptance >= 80) {
        details.push(`✓ Rule acceptance tinggi (${score.components.rule_acceptance.toFixed(0)}%) - keputusan sistem selaras dengan ekspektasi`);
    } else if (score.components.rule_acceptance >= 60) {
        details.push(`⚠ Rule acceptance moderat (${score.components.rule_acceptance.toFixed(0)}%) - beberapa keputusan ditolak`);
    } else {
        details.push(`✗ Rule acceptance rendah (${score.components.rule_acceptance.toFixed(0)}%) - banyak keputusan ditolak`);
    }

    // AI alignment analysis
    if (score.components.ai_alignment >= 80) {
        details.push(`✓ AI alignment tinggi (${score.components.ai_alignment.toFixed(0)}%) - AI recommendations akurat`);
    } else if (score.components.ai_alignment >= 60) {
        details.push(`⚠ AI alignment moderat (${score.components.ai_alignment.toFixed(0)}%)`);
    } else {
        details.push(`✗ AI alignment rendah (${score.components.ai_alignment.toFixed(0)}%) - AI recommendations kurang akurat`);
    }

    // Stability analysis
    if (score.components.stability >= 90) {
        details.push(`✓ Stability excellent (${score.components.stability.toFixed(0)}%) - sangat sedikit rollback`);
    } else if (score.components.stability >= 70) {
        details.push(`⚠ Stability moderat (${score.components.stability.toFixed(0)}%) - beberapa rollback terjadi`);
    } else {
        details.push(`✗ Stability rendah (${score.components.stability.toFixed(0)}%) - banyak rollback`);
    }

    // Forecast accuracy analysis
    if (score.components.forecast_accuracy >= 70) {
        details.push(`✓ Forecast accuracy baik (${score.components.forecast_accuracy.toFixed(0)}%)`);
    } else if (score.components.forecast_accuracy >= 50) {
        details.push(`⚠ Forecast accuracy moderat (${score.components.forecast_accuracy.toFixed(0)}%)`);
    } else {
        details.push(`✗ Forecast accuracy rendah (${score.components.forecast_accuracy.toFixed(0)}%)`);
    }

    // Next steps based on recommendation
    const nextSteps: Record<TrustScore['recommendation'], string[]> = {
        'pause': [
            'PAUSE semua autonomous execution',
            'Investigasi penyebab trust score rendah',
            'Review dan perbaiki rules yang bermasalah',
            'Konsultasi dengan CFO sebelum melanjutkan'
        ],
        'review': [
            'Review rules dengan rejection rate tinggi',
            'Analisis penyebab rollback',
            'Tingkatkan monitoring',
            'Pertimbangkan turunkan autonomy level'
        ],
        'continue': [
            'Lanjutkan dengan monitoring rutin',
            'Maintain current autonomy level',
            'Review mingguan tetap dilakukan'
        ],
        'expand': [
            'Sistem ready untuk expansion',
            'Pertimbangkan tingkatkan autonomy level (dengan CFO approval)',
            'Tambah rules baru jika diperlukan',
            'Maintain monitoring ketat'
        ]
    };

    return {
        summary: summaries[score.trust_level],
        details,
        next_steps: nextSteps[score.recommendation]
    };
}
