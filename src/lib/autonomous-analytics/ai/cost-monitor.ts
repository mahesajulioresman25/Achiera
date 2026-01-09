// AI Cost Monitoring - Track and optimize AI usage costs
// CRITICAL: Optimize costs without reducing safety or audit quality

import { prisma } from '@/lib/prisma';

interface AICostReport {
    summary: string;
    daily_cost_estimate: number;
    top_cost_drivers: string[];
    safe_optimizations: string[];
    no_action_needed: boolean;
}

interface AIUsageStats {
    total_calls: number;
    total_input_tokens: number;
    total_output_tokens: number;
    avg_tokens_per_call: number;
    duplicate_calls: number;
    cacheable_calls: number;
}

/**
 * Generate AI cost optimization report
 */
export async function generateCostReport(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<AICostReport> {
    // Fetch AI usage data
    const usageStats = await fetchAIUsageStats(brandId, startDate, endDate);

    // Calculate costs (Anthropic Claude 3.5 Sonnet pricing)
    const inputCost = (usageStats.total_input_tokens / 1_000_000) * 3; // $3 per 1M tokens
    const outputCost = (usageStats.total_output_tokens / 1_000_000) * 15; // $15 per 1M tokens
    const totalCost = inputCost + outputCost;

    // Calculate daily average
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyCostEstimate = totalCost / days;

    // Identify cost drivers
    const topCostDrivers = identifyCostDrivers(usageStats);

    // Identify safe optimizations
    const safeOptimizations = identifySafeOptimizations(usageStats);

    // Build summary
    const summary = buildCostSummary(
        usageStats,
        dailyCostEstimate,
        safeOptimizations.length
    );

    // Determine if action is needed
    const noActionNeeded = safeOptimizations.length === 0 && dailyCostEstimate < 5;

    return {
        summary,
        daily_cost_estimate: parseFloat(dailyCostEstimate.toFixed(2)),
        top_cost_drivers: topCostDrivers,
        safe_optimizations: safeOptimizations,
        no_action_needed: noActionNeeded
    };
}

/**
 * Fetch AI usage statistics
 */
async function fetchAIUsageStats(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<AIUsageStats> {
    // Fetch AI explanation logs
    const aiLogs = await prisma.aiExplanationLog.findMany({
        where: {
            brandId,
            createdAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });

    const totalCalls = aiLogs.length;
    const totalInputTokens = aiLogs.reduce((sum, log) => sum + (log.inputTokens || 0), 0);
    const totalOutputTokens = aiLogs.reduce((sum, log) => sum + (log.outputTokens || 0), 0);
    const avgTokensPerCall = totalCalls > 0
        ? (totalInputTokens + totalOutputTokens) / totalCalls
        : 0;

    // Identify duplicates (same ruleId + similar metrics within 1 hour)
    const duplicateCalls = identifyDuplicateCalls(aiLogs);

    // Identify cacheable calls (same context, different timestamps)
    const cacheableCalls = identifyCacheableCalls(aiLogs);

    return {
        total_calls: totalCalls,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        avg_tokens_per_call: Math.round(avgTokensPerCall),
        duplicate_calls: duplicateCalls,
        cacheable_calls: cacheableCalls
    };
}

/**
 * Identify duplicate AI calls
 */
function identifyDuplicateCalls(logs: any[]): number {
    const seen = new Map<string, Date>();
    let duplicates = 0;

    for (const log of logs) {
        const key = `${log.ruleId}_${JSON.stringify(log.metricsSnapshot)}`;
        const lastSeen = seen.get(key);

        if (lastSeen) {
            const hoursSince = (log.createdAt.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

            // If same context within 1 hour, it's a duplicate
            if (hoursSince < 1) {
                duplicates++;
            }
        }

        seen.set(key, log.createdAt);
    }

    return duplicates;
}

/**
 * Identify cacheable calls
 */
function identifyCacheableCalls(logs: any[]): number {
    const contextCounts = new Map<string, number>();

    for (const log of logs) {
        const contextKey = `${log.ruleId}_${log.promptType}`;
        contextCounts.set(contextKey, (contextCounts.get(contextKey) || 0) + 1);
    }

    // Count calls that could benefit from caching (repeated contexts)
    let cacheable = 0;
    for (const count of contextCounts.values()) {
        if (count > 1) {
            cacheable += count - 1; // First call can't be cached
        }
    }

    return cacheable;
}

/**
 * Identify top cost drivers
 */
function identifyCostDrivers(stats: AIUsageStats): string[] {
    const drivers: string[] = [];

    // High token usage per call
    if (stats.avg_tokens_per_call > 3000) {
        drivers.push(
            `Token usage tinggi: rata-rata ${stats.avg_tokens_per_call} tokens per call (threshold: 3000)`
        );
    }

    // High call volume
    if (stats.total_calls > 100) {
        drivers.push(
            `Volume call tinggi: ${stats.total_calls} AI calls (dapat dikurangi dengan caching)`
        );
    }

    // Duplicate calls
    if (stats.duplicate_calls > 10) {
        drivers.push(
            `Duplicate calls: ${stats.duplicate_calls} calls dengan context identik dalam 1 jam`
        );
    }

    return drivers;
}

/**
 * Identify safe optimization opportunities
 */
function identifySafeOptimizations(stats: AIUsageStats): string[] {
    const optimizations: string[] = [];

    // Caching opportunity
    if (stats.cacheable_calls > 20) {
        const savingsPercent = ((stats.cacheable_calls / stats.total_calls) * 100).toFixed(0);
        optimizations.push(
            `CACHING: Implementasi cache untuk context yang sama dapat menghemat ${savingsPercent}% biaya (${stats.cacheable_calls} dari ${stats.total_calls} calls)`
        );
    }

    // Reduce duplicate calls
    if (stats.duplicate_calls > 10) {
        const savingsPercent = ((stats.duplicate_calls / stats.total_calls) * 100).toFixed(0);
        optimizations.push(
            `DEDUPLICATION: Hindari duplicate calls dalam 1 jam dapat menghemat ${savingsPercent}% biaya (${stats.duplicate_calls} duplicate calls terdeteksi)`
        );
    }

    // Token optimization
    if (stats.avg_tokens_per_call > 3000) {
        optimizations.push(
            `TOKEN OPTIMIZATION: Kurangi historical data dari 90 hari ke 30 hari dapat menghemat ~20% token tanpa mengurangi kualitas explanation`
        );
    }

    // Batch processing
    if (stats.total_calls > 50) {
        optimizations.push(
            `BATCH PROCESSING: Batch multiple decisions dalam single AI call dapat menghemat ~30% overhead cost`
        );
    }

    // Prompt optimization
    if (stats.avg_tokens_per_call > 2500) {
        optimizations.push(
            `PROMPT OPTIMIZATION: Simplifikasi prompt template tanpa mengurangi kualitas output dapat menghemat ~15% token`
        );
    }

    return optimizations;
}

/**
 * Build cost summary in Indonesian
 */
function buildCostSummary(
    stats: AIUsageStats,
    dailyCost: number,
    optimizationCount: number
): string {
    const monthlyCost = dailyCost * 30;

    let summary = `Biaya AI harian: $${dailyCost.toFixed(2)} (~Rp ${(dailyCost * 15000).toLocaleString('id-ID')}/hari, Rp ${(monthlyCost * 15000).toLocaleString('id-ID')}/bulan). `;
    summary += `Total ${stats.total_calls} AI calls dengan rata-rata ${stats.avg_tokens_per_call} tokens per call. `;

    if (optimizationCount > 0) {
        summary += `Terdapat ${optimizationCount} peluang optimasi yang aman tanpa mengurangi kualitas.`;
    } else {
        summary += `Tidak ada optimasi yang diperlukan - biaya sudah efisien.`;
    }

    return summary;
}

/**
 * Calculate potential savings from optimizations
 */
export function calculatePotentialSavings(
    currentDailyCost: number,
    optimizations: string[]
): {
    daily_savings: number;
    monthly_savings: number;
    annual_savings: number;
} {
    let totalSavingsPercent = 0;

    for (const opt of optimizations) {
        if (opt.includes('CACHING')) {
            const match = opt.match(/(\d+)%/);
            if (match) totalSavingsPercent += parseInt(match[1]) * 0.8; // 80% cache hit rate
        } else if (opt.includes('DEDUPLICATION')) {
            const match = opt.match(/(\d+)%/);
            if (match) totalSavingsPercent += parseInt(match[1]);
        } else if (opt.includes('TOKEN OPTIMIZATION')) {
            totalSavingsPercent += 20;
        } else if (opt.includes('BATCH PROCESSING')) {
            totalSavingsPercent += 30;
        } else if (opt.includes('PROMPT OPTIMIZATION')) {
            totalSavingsPercent += 15;
        }
    }

    // Cap at 70% max savings (conservative)
    totalSavingsPercent = Math.min(totalSavingsPercent, 70);

    const dailySavings = currentDailyCost * (totalSavingsPercent / 100);

    return {
        daily_savings: parseFloat(dailySavings.toFixed(2)),
        monthly_savings: parseFloat((dailySavings * 30).toFixed(2)),
        annual_savings: parseFloat((dailySavings * 365).toFixed(2))
    };
}

/**
 * Format cost report for email
 */
export function formatCostReportForEmail(report: AICostReport): string {
    const savings = calculatePotentialSavings(
        report.daily_cost_estimate,
        report.safe_optimizations
    );

    return `
LAPORAN BIAYA AI - MINGGUAN

${report.summary}

BIAYA SAAT INI:
- Harian: $${report.daily_cost_estimate.toFixed(2)}
- Bulanan: $${(report.daily_cost_estimate * 30).toFixed(2)}
- Tahunan: $${(report.daily_cost_estimate * 365).toFixed(2)}

${report.top_cost_drivers.length > 0 ? `
COST DRIVERS:
${report.top_cost_drivers.map(d => `• ${d}`).join('\n')}
` : ''}

${report.safe_optimizations.length > 0 ? `
PELUANG OPTIMASI (AMAN):
${report.safe_optimizations.map(o => `✓ ${o}`).join('\n')}

POTENSI PENGHEMATAN:
- Harian: $${savings.daily_savings.toFixed(2)}
- Bulanan: $${savings.monthly_savings.toFixed(2)}
- Tahunan: $${savings.annual_savings.toFixed(2)}
` : 'Tidak ada optimasi yang diperlukan - biaya sudah efisien.'}

CATATAN PENTING:
- Semua optimasi di atas TIDAK mengurangi kualitas explanation
- Semua optimasi di atas TIDAK mengurangi safety atau audit quality
- Implementasi dapat dilakukan secara bertahap

---
Laporan ini dibuat otomatis oleh sistem ACHIERA AI Cost Monitoring.
  `.trim();
}
