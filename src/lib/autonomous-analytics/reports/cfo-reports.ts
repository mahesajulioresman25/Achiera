// Daily Autonomy Report Generator - CFO-facing daily summary
// CRITICAL: Concise, actionable, CFO-readable

import { calculateTrustMetrics } from '../trust/trust-metrics';
import { calculateTrustScore, getTrustScoreInterpretation } from '../trust/trust-score';
import { evaluateAllRules } from '../trust/rule-performance';

/**
 * Generate daily autonomy report
 */
export async function generateDailyReport(
    brandId: string,
    date: Date
): Promise<string> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Calculate metrics
    const metrics = await calculateTrustMetrics(brandId, startDate, endDate);
    const trustScore = calculateTrustScore(metrics);
    const interpretation = getTrustScoreInterpretation(trustScore);

    // Fetch rule performances
    const rulePerformances = await evaluateAllRules(brandId, startDate, endDate);

    // Build report
    return `
# LAPORAN AUTONOMOUS HARIAN
**Tanggal**: ${date.toLocaleDateString('id-ID')}  
**Brand ID**: ${brandId}

---

## RINGKASAN EKSEKUTIF

${interpretation.summary}

**Trust Score**: ${trustScore.overall_score}/100 (${trustScore.trust_level.replace('_', ' ').toUpperCase()})

**Rekomendasi**: **${trustScore.recommendation.toUpperCase()}**

---

## METRIK KUNCI

### Keputusan
- Total Keputusan: **${metrics.total_decisions}**
- Approved: **${metrics.approved_decisions}** (${(metrics.rule_acceptance_rate * 100).toFixed(0)}%)
- Rejected: **${metrics.rejected_decisions}** (${((metrics.rejected_decisions / metrics.total_decisions) * 100).toFixed(0)}%)

### Eksekusi
- Total Eksekusi: **${metrics.total_executions}**
- Rollback: **${metrics.rollbacks}** (${(metrics.rollback_frequency * 100).toFixed(0)}%)
  - Auto: ${metrics.auto_rollbacks}
  - Manual: ${metrics.manual_rollbacks}

### AI & Forecast
- AI Agreement: **${(metrics.ai_agreement_rate * 100).toFixed(0)}%**
- Forecast Accuracy: **${(metrics.forecast_accuracy * 100).toFixed(0)}%**

---

## KOMPONEN TRUST SCORE

| Komponen | Score | Bobot |
|----------|-------|-------|
| Rule Acceptance | ${trustScore.components.rule_acceptance.toFixed(0)}/100 | ${(trustScore.weights.rule_acceptance * 100).toFixed(0)}% |
| AI Alignment | ${trustScore.components.ai_alignment.toFixed(0)}/100 | ${(trustScore.weights.ai_alignment * 100).toFixed(0)}% |
| Stability | ${trustScore.components.stability.toFixed(0)}/100 | ${(trustScore.weights.stability * 100).toFixed(0)}% |
| Forecast Accuracy | ${trustScore.components.forecast_accuracy.toFixed(0)}/100 | ${(trustScore.weights.forecast_accuracy * 100).toFixed(0)}% |

---

## PERFORMA RULE

${rulePerformances.length > 0 ? rulePerformances.map(rp => `
### ${rp.ruleName} (${rp.ruleId})
- **Status**: ${getStatusBadge(rp.status)}
- Trigger Count: ${rp.trigger_count}
- Approval Ratio: ${(rp.approval_ratio * 100).toFixed(0)}% (${rp.approved_count}/${rp.trigger_count})
- Outcome Success: ${(rp.outcome_success_rate * 100).toFixed(0)}% (${rp.outcomes_successful}/${rp.outcomes_measured})
- Risk Trend: ${rp.risk_trend === 'improving' ? '📈 Improving' : rp.risk_trend === 'stable' ? '➡️ Stable' : '📉 Worsening'}
${rp.status !== 'OK' ? `- **Alasan**: ${rp.status_reason}` : ''}
`).join('\n') : 'Tidak ada rule yang aktif'}

---

## ANALISIS

${interpretation.details.map(d => `- ${d}`).join('\n')}

---

## LANGKAH SELANJUTNYA

${interpretation.next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

**Catatan**: Laporan ini dibuat otomatis oleh sistem ACHIERA Autonomous Analytics.  
Untuk pertanyaan atau review lebih lanjut, hubungi tim platform.
  `.trim();
}

/**
 * Get status badge
 */
function getStatusBadge(status: 'OK' | 'REVIEW' | 'PAUSE'): string {
    const badges = {
        'OK': '✅ OK',
        'REVIEW': '⚠️ REVIEW',
        'PAUSE': '🔴 PAUSE'
    };

    return badges[status];
}

/**
 * Generate weekly trust report
 */
export async function generateWeeklyReport(
    brandId: string,
    weekStartDate: Date
): Promise<string> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // Calculate metrics
    const metrics = await calculateTrustMetrics(brandId, weekStartDate, weekEndDate);
    const trustScore = calculateTrustScore(metrics);
    const interpretation = getTrustScoreInterpretation(trustScore);

    // Fetch rule performances
    const rulePerformances = await evaluateAllRules(brandId, weekStartDate, weekEndDate);

    // Calculate estimated vs realized impact
    const impactAnalysis = await analyzeImpactAccuracy(brandId, weekStartDate, weekEndDate);

    return `
# LAPORAN TRUST MINGGUAN
**Periode**: ${weekStartDate.toLocaleDateString('id-ID')} - ${weekEndDate.toLocaleDateString('id-ID')}  
**Brand ID**: ${brandId}

---

## RINGKASAN EKSEKUTIF

${interpretation.summary}

**Trust Score**: ${trustScore.overall_score}/100 (${trustScore.trust_level.replace('_', ' ').toUpperCase()})

**Rekomendasi**: **${trustScore.recommendation.toUpperCase()}**

---

## METRIK MINGGUAN

### Keputusan & Approval
- Total Keputusan: **${metrics.total_decisions}**
- Approval Rate: **${(metrics.rule_acceptance_rate * 100).toFixed(0)}%**
- Rejection Rate: **${((metrics.rejected_decisions / metrics.total_decisions) * 100).toFixed(0)}%**

### Eksekusi & Rollback
- Total Eksekusi: **${metrics.total_executions}**
- Rollback Frequency: **${(metrics.rollback_frequency * 100).toFixed(0)}%**
- Auto Rollback: ${metrics.auto_rollbacks}
- Manual Rollback: ${metrics.manual_rollbacks}

### Kualitas AI & Forecast
- AI Agreement Rate: **${(metrics.ai_agreement_rate * 100).toFixed(0)}%**
- Forecast Accuracy: **${(metrics.forecast_accuracy * 100).toFixed(0)}%**

---

## ESTIMASI VS REALISASI

${impactAnalysis}

---

## PERFORMA RULE (Top 5)

${rulePerformances.slice(0, 5).map((rp, i) => `
${i + 1}. **${rp.ruleName}** (${getStatusBadge(rp.status)})
   - Trigger: ${rp.trigger_count}x | Approval: ${(rp.approval_ratio * 100).toFixed(0)}% | Success: ${(rp.outcome_success_rate * 100).toFixed(0)}%
   ${rp.status !== 'OK' ? `- ⚠️ ${rp.status_reason}` : ''}
`).join('\n')}

---

## RISK FLAGS

${getRiskFlags(rulePerformances, metrics)}

---

## REKOMENDASI AKSI (NON-BINDING)

${interpretation.next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

**Catatan**: Rekomendasi di atas bersifat NON-BINDING dan memerlukan approval CFO/Owner sebelum implementasi.
  `.trim();
}

/**
 * Analyze impact accuracy
 */
async function analyzeImpactAccuracy(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<string> {
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            executedAt: {
                gte: startDate,
                lt: endDate
            },
            executionStatus: 'success'
        }
    });

    const withImpact = executions.filter(e => {
        const pre = e.preMetrics as any;
        const post = e.postMetrics as any;
        return pre?.estimated_impact && post?.actual_impact;
    });

    if (withImpact.length === 0) {
        return 'Belum ada data impact yang cukup untuk analisis.';
    }

    const totalEstimated = withImpact.reduce((sum, e) => {
        const pre = e.preMetrics as any;
        return sum + (pre.estimated_impact || 0);
    }, 0);

    const totalActual = withImpact.reduce((sum, e) => {
        const post = e.postMetrics as any;
        return sum + (post.actual_impact || 0);
    }, 0);

    const delta = totalActual - totalEstimated;
    const deltaPercent = totalEstimated > 0 ? (delta / totalEstimated) * 100 : 0;

    return `
- Estimasi Total: Rp ${totalEstimated.toLocaleString('id-ID')}
- Realisasi Total: Rp ${totalActual.toLocaleString('id-ID')}
- Delta: Rp ${delta.toLocaleString('id-ID')} (${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%)
- Akurasi: ${withImpact.length} dari ${executions.length} eksekusi memiliki data impact
  `.trim();
}

/**
 * Get risk flags
 */
function getRiskFlags(
    rulePerformances: any[],
    metrics: any
): string {
    const flags: string[] = [];

    // Rules needing attention
    const pauseRules = rulePerformances.filter(r => r.status === 'PAUSE');
    const reviewRules = rulePerformances.filter(r => r.status === 'REVIEW');

    if (pauseRules.length > 0) {
        flags.push(`🔴 **${pauseRules.length} rule(s) perlu di-PAUSE**: ${pauseRules.map(r => r.ruleName).join(', ')}`);
    }

    if (reviewRules.length > 0) {
        flags.push(`⚠️ **${reviewRules.length} rule(s) perlu REVIEW**: ${reviewRules.map(r => r.ruleName).join(', ')}`);
    }

    // High rollback rate
    if (metrics.rollback_frequency > 0.15) {
        flags.push(`⚠️ **Rollback frequency tinggi**: ${(metrics.rollback_frequency * 100).toFixed(0)}% (threshold: 15%)`);
    }

    // Low approval rate
    if (metrics.rule_acceptance_rate < 0.60) {
        flags.push(`⚠️ **Approval rate rendah**: ${(metrics.rule_acceptance_rate * 100).toFixed(0)}% (threshold: 60%)`);
    }

    if (flags.length === 0) {
        return 'Tidak ada risk flags - sistem beroperasi normal.';
    }

    return flags.join('\n');
}
