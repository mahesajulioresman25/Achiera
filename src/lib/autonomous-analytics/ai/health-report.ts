// Weekly Autonomy Health Report Generator
// Conservative governance reporting for CFO/CTO

import { prisma } from '@/lib/prisma';

interface AutonomyHealthReport {
    summary: string;
    metrics: {
        executions: number;
        auto_rollbacks: number;
        rollback_rate: number;
        avg_confidence: number;
        cfo_overrides: number;
    };
    governance_flags: string[];
    recommendation: 'continue' | 'pause' | 'review';
}

/**
 * Generate weekly autonomy health report
 */
export async function generateWeeklyHealthReport(
    brandId: string,
    weekStartDate: Date
): Promise<AutonomyHealthReport> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // Fetch execution data
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            executedAt: {
                gte: weekStartDate,
                lt: weekEndDate
            }
        }
    });

    // Fetch manual overrides
    const overrides = await prisma.manualOverride.findMany({
        where: {
            brandId,
            performedAt: {
                gte: weekStartDate,
                lt: weekEndDate
            },
            overrideType: {
                in: ['RULE_FORCE_REJECT', 'DECISION_OVERRIDE']
            }
        }
    });

    // Calculate metrics
    const totalExecutions = executions.length;
    const autoRollbacks = executions.filter(e =>
        e.executionStatus === 'rolled_back' &&
        e.rollbackStatus === 'auto'
    ).length;

    const rollbackRate = totalExecutions > 0
        ? autoRollbacks / totalExecutions
        : 0;

    const avgConfidence = totalExecutions > 0
        ? executions.reduce((sum, e) => {
            const auditData = e.auditData as any;
            return sum + (auditData?.confidenceScore || 0);
        }, 0) / totalExecutions
        : 0;

    const cfoOverrides = overrides.filter(o =>
        o.performedBy.includes('cfo') ||
        o.performedBy.includes('owner')
    ).length;

    // Build summary
    const summary = buildSummary(
        totalExecutions,
        autoRollbacks,
        rollbackRate,
        avgConfidence,
        cfoOverrides
    );

    // Identify governance flags
    const governance_flags = identifyGovernanceFlags(
        totalExecutions,
        rollbackRate,
        avgConfidence,
        cfoOverrides,
        executions
    );

    // Determine recommendation
    const recommendation = determineRecommendation(
        rollbackRate,
        avgConfidence,
        cfoOverrides,
        governance_flags.length
    );

    return {
        summary,
        metrics: {
            executions: totalExecutions,
            auto_rollbacks: autoRollbacks,
            rollback_rate: parseFloat(rollbackRate.toFixed(3)),
            avg_confidence: parseFloat(avgConfidence.toFixed(3)),
            cfo_overrides: cfoOverrides
        },
        governance_flags,
        recommendation
    };
}

/**
 * Build executive summary in Indonesian
 */
function buildSummary(
    executions: number,
    rollbacks: number,
    rollbackRate: number,
    avgConfidence: number,
    overrides: number
): string {
    const weekDesc = `Minggu ini sistem melakukan ${executions} eksekusi otonom`;
    const rollbackDesc = rollbacks > 0
        ? `, dengan ${rollbacks} auto-rollback (${(rollbackRate * 100).toFixed(1)}%)`
        : ' tanpa auto-rollback';
    const confidenceDesc = `. Rata-rata confidence score ${(avgConfidence * 100).toFixed(0)}%`;
    const overrideDesc = overrides > 0
        ? `. Terdapat ${overrides} manual override dari CFO/Owner`
        : '. Tidak ada manual override';

    return weekDesc + rollbackDesc + confidenceDesc + overrideDesc + '.';
}

/**
 * Identify governance flags (concerns)
 */
function identifyGovernanceFlags(
    executions: number,
    rollbackRate: number,
    avgConfidence: number,
    overrides: number,
    executionData: any[]
): string[] {
    const flags: string[] = [];

    // High rollback rate (>10%)
    if (rollbackRate > 0.10) {
        flags.push(
            `ROLLBACK RATE TINGGI: ${(rollbackRate * 100).toFixed(1)}% eksekusi di-rollback (threshold normal: <10%)`
        );
    }

    // Low confidence score (<0.85)
    if (avgConfidence < 0.85) {
        flags.push(
            `CONFIDENCE RENDAH: Rata-rata confidence ${(avgConfidence * 100).toFixed(0)}% di bawah threshold 85%`
        );
    }

    // High override rate (>5 per week)
    if (overrides > 5) {
        flags.push(
            `OVERRIDE TINGGI: ${overrides} manual override dalam seminggu menunjukkan sistem belum sesuai ekspektasi`
        );
    }

    // Execution volume spike (>50 per week for Level 1)
    if (executions > 50) {
        flags.push(
            `VOLUME TINGGI: ${executions} eksekusi per minggu melebihi ekspektasi untuk Level 1 (threshold: 50)`
        );
    }

    // No executions (system not working)
    if (executions === 0) {
        flags.push(
            'TIDAK ADA EKSEKUSI: Sistem tidak melakukan eksekusi apapun, perlu investigasi'
        );
    }

    // Check for repeated failures on same rule
    const ruleFailures = analyzeRuleFailures(executionData);
    if (ruleFailures.length > 0) {
        flags.push(
            `RULE BERMASALAH: ${ruleFailures.join(', ')} memiliki tingkat kegagalan tinggi`
        );
    }

    return flags;
}

/**
 * Analyze rule failures
 */
function analyzeRuleFailures(executions: any[]): string[] {
    const ruleStats: Record<string, { total: number; failed: number }> = {};

    for (const exec of executions) {
        if (!exec.ruleId) continue;

        if (!ruleStats[exec.ruleId]) {
            ruleStats[exec.ruleId] = { total: 0, failed: 0 };
        }

        ruleStats[exec.ruleId].total++;

        if (exec.executionStatus === 'failed' || exec.executionStatus === 'rolled_back') {
            ruleStats[exec.ruleId].failed++;
        }
    }

    const problematicRules: string[] = [];

    for (const [ruleId, stats] of Object.entries(ruleStats)) {
        const failureRate = stats.failed / stats.total;

        // Flag rules with >30% failure rate
        if (failureRate > 0.30 && stats.total >= 3) {
            problematicRules.push(
                `${ruleId} (${stats.failed}/${stats.total} gagal)`
            );
        }
    }

    return problematicRules;
}

/**
 * Determine recommendation
 */
function determineRecommendation(
    rollbackRate: number,
    avgConfidence: number,
    overrides: number,
    flagCount: number
): 'continue' | 'pause' | 'review' {
    // PAUSE if critical issues
    if (rollbackRate > 0.25 || avgConfidence < 0.70 || overrides > 10) {
        return 'pause';
    }

    // REVIEW if moderate concerns
    if (flagCount >= 2 || rollbackRate > 0.10 || avgConfidence < 0.85 || overrides > 5) {
        return 'review';
    }

    // CONTINUE if healthy
    return 'continue';
}

/**
 * Get recommendation explanation
 */
export function getRecommendationExplanation(
    recommendation: 'continue' | 'pause' | 'review'
): string {
    const explanations = {
        continue: 'Sistem beroperasi dalam batas normal. Lanjutkan monitoring rutin.',
        review: 'Terdapat indikator yang memerlukan review. Disarankan evaluasi manual sebelum melanjutkan.',
        pause: 'Terdapat masalah signifikan. PAUSE sistem dan lakukan investigasi mendalam sebelum melanjutkan.'
    };

    return explanations[recommendation];
}

/**
 * Format report for email/notification
 */
export function formatReportForEmail(report: AutonomyHealthReport): string {
    return `
LAPORAN KESEHATAN SISTEM AUTONOMOUS - MINGGUAN

${report.summary}

METRIK KUNCI:
- Total Eksekusi: ${report.metrics.executions}
- Auto-Rollback: ${report.metrics.auto_rollbacks} (${(report.metrics.rollback_rate * 100).toFixed(1)}%)
- Avg Confidence: ${(report.metrics.avg_confidence * 100).toFixed(0)}%
- CFO Override: ${report.metrics.cfo_overrides}

${report.governance_flags.length > 0 ? `
GOVERNANCE FLAGS:
${report.governance_flags.map(f => `⚠️ ${f}`).join('\n')}
` : 'Tidak ada governance flags.'}

REKOMENDASI: ${report.recommendation.toUpperCase()}
${getRecommendationExplanation(report.recommendation)}

---
Laporan ini dibuat otomatis oleh sistem ACHIERA Autonomous Analytics.
Untuk pertanyaan, hubungi tim platform.
  `.trim();
}
