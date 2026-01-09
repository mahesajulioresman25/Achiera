// AI Forensic Reviewer - Incident analysis from audit logs
// CRITICAL: Neutral, factual, no blame assignment

import { prisma } from '@/lib/prisma';

interface IncidentReport {
    incident_summary: string;
    timeline: string[];
    rule: string;
    action: string;
    rollback: boolean;
    system_behavior: 'correct' | 'needs_review';
    notes: string[];
}

/**
 * Analyze incident from audit logs
 */
export async function analyzeIncident(
    executionId: string
): Promise<IncidentReport> {
    // Fetch execution log
    const execution = await prisma.executionLog.findUnique({
        where: { id: executionId },
        include: {
            snapshot: true
        }
    });

    if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
    }

    // Fetch audit trail
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            brandId: execution.brandId,
            metadata: {
                path: ['executionId'],
                equals: executionId
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    // Reconstruct timeline
    const timeline = reconstructTimeline(execution, auditLogs);

    // Identify rule and action
    const rule = execution.ruleId || 'Unknown';
    const action = execution.actionId || 'Unknown';

    // Check if rollback occurred
    const rollback = execution.executionStatus === 'rolled_back';

    // Determine system behavior
    const systemBehavior = determineSystemBehavior(execution, auditLogs);

    // Build summary
    const incidentSummary = buildIncidentSummary(
        execution,
        rollback,
        systemBehavior
    );

    // Extract notes
    const notes = extractNotes(execution, auditLogs);

    return {
        incident_summary: incidentSummary,
        timeline,
        rule,
        action,
        rollback,
        system_behavior: systemBehavior,
        notes
    };
}

/**
 * Reconstruct timeline from audit logs
 */
function reconstructTimeline(
    execution: any,
    auditLogs: any[]
): string[] {
    const timeline: string[] = [];

    for (const log of auditLogs) {
        const timestamp = log.timestamp.toISOString().substring(11, 19); // HH:MM:SS
        const event = log.eventType;
        const metadata = log.metadata as any;

        switch (event) {
            case 'rule_evaluated':
                timeline.push(
                    `${timestamp} - Rule ${metadata.ruleId} dievaluasi dengan confidence ${(metadata.confidenceScore * 100).toFixed(0)}%`
                );
                break;

            case 'decision_made':
                timeline.push(
                    `${timestamp} - Keputusan dibuat: ${metadata.rulesTriggered} dari ${metadata.rulesEvaluated} rules triggered`
                );
                break;

            case 'execution_started':
                timeline.push(
                    `${timestamp} - Eksekusi dimulai (ID: ${metadata.executionId})`
                );
                break;

            case 'execution_completed':
                timeline.push(
                    `${timestamp} - Eksekusi selesai dengan status: ${metadata.status}`
                );
                break;

            case 'rollback_executed':
                timeline.push(
                    `${timestamp} - Rollback dieksekusi (triggered by: ${metadata.triggeredBy})`
                );
                break;

            case 'safety_gate_blocked':
                timeline.push(
                    `${timestamp} - Safety gate "${metadata.gateName}" memblokir: ${metadata.reason}`
                );
                break;

            default:
                timeline.push(
                    `${timestamp} - ${event}`
                );
        }
    }

    return timeline;
}

/**
 * Determine if system behaved correctly
 */
function determineSystemBehavior(
    execution: any,
    auditLogs: any[]
): 'correct' | 'needs_review' {
    // Check for safety gate violations
    const safetyGateBlocks = auditLogs.filter(
        log => log.eventType === 'safety_gate_blocked'
    );

    // If safety gates blocked but execution still happened, needs review
    if (safetyGateBlocks.length > 0 && execution.executionStatus === 'success') {
        return 'needs_review';
    }

    // If rollback was auto-triggered, system behaved correctly
    if (execution.executionStatus === 'rolled_back' &&
        execution.rollbackStatus === 'auto') {
        return 'correct';
    }

    // If manual rollback, check if it was within expected timeframe
    if (execution.executionStatus === 'rolled_back' &&
        execution.rollbackStatus === 'manual') {
        const hoursSinceExecution =
            (execution.rolledBackAt.getTime() - execution.executedAt.getTime()) / (1000 * 60 * 60);

        // If rolled back within 24 hours, system provided the capability correctly
        if (hoursSinceExecution <= 24) {
            return 'correct';
        }
    }

    // If execution failed, check if it was expected
    if (execution.executionStatus === 'failed') {
        // Failed execution with proper error handling is correct behavior
        return 'correct';
    }

    // Default: system behaved correctly
    return 'correct';
}

/**
 * Build incident summary in Indonesian
 */
function buildIncidentSummary(
    execution: any,
    rollback: boolean,
    systemBehavior: 'correct' | 'needs_review'
): string {
    const actionDesc = getActionDescription(execution.actionId);
    const statusDesc = getStatusDescription(execution.executionStatus);
    const behaviorDesc = systemBehavior === 'correct'
        ? 'Sistem beroperasi sesuai desain'
        : 'Memerlukan review lebih lanjut';

    let summary = `${actionDesc} pada ${execution.executedAt.toISOString()}. `;
    summary += `Status: ${statusDesc}. `;

    if (rollback) {
        const rollbackType = execution.rollbackStatus === 'auto' ? 'otomatis' : 'manual';
        summary += `Rollback ${rollbackType} dieksekusi pada ${execution.rolledBackAt?.toISOString()}. `;
    }

    summary += behaviorDesc + '.';

    return summary;
}

/**
 * Get action description in Indonesian
 */
function getActionDescription(actionId: string): string {
    const descriptions: Record<string, string> = {
        'ADS_PAUSE': 'Kampanye iklan dijeda',
        'ADS_RESUME': 'Kampanye iklan dilanjutkan',
        'ADS_BUDGET_UP': 'Budget iklan ditingkatkan',
        'ADS_BUDGET_DOWN': 'Budget iklan diturunkan',
        'PROMO_STOP': 'Promosi dihentikan',
        'PROMO_RESUME': 'Promosi dilanjutkan'
    };

    return descriptions[actionId] || `Aksi ${actionId}`;
}

/**
 * Get status description in Indonesian
 */
function getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
        'success': 'Berhasil',
        'failed': 'Gagal',
        'rolled_back': 'Di-rollback',
        'pending': 'Pending',
        'cancelled': 'Dibatalkan'
    };

    return descriptions[status] || status;
}

/**
 * Extract factual notes from execution
 */
function extractNotes(
    execution: any,
    auditLogs: any[]
): string[] {
    const notes: string[] = [];

    // Pre-execution metrics
    const preMetrics = execution.preMetrics as Record<string, number>;
    if (preMetrics && Object.keys(preMetrics).length > 0) {
        const metricsDesc = Object.entries(preMetrics)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        notes.push(`Metrik sebelum eksekusi: ${metricsDesc}`);
    }

    // Post-execution metrics
    const postMetrics = execution.postMetrics as Record<string, number>;
    if (postMetrics && Object.keys(postMetrics).length > 0) {
        const metricsDesc = Object.entries(postMetrics)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        notes.push(`Metrik setelah eksekusi: ${metricsDesc}`);
    }

    // Snapshot availability
    if (execution.snapshotId) {
        notes.push(`Snapshot tersedia (ID: ${execution.snapshotId})`);
    } else {
        notes.push('Tidak ada snapshot tersedia');
    }

    // Safety gates
    const safetyGateBlocks = auditLogs.filter(
        log => log.eventType === 'safety_gate_blocked'
    );

    if (safetyGateBlocks.length > 0) {
        notes.push(
            `${safetyGateBlocks.length} safety gate(s) memblokir eksekusi`
        );
    } else {
        notes.push('Semua safety gates passed');
    }

    // Audit data
    const auditData = execution.auditData as any;
    if (auditData?.confidenceScore) {
        notes.push(
            `Confidence score: ${(auditData.confidenceScore * 100).toFixed(0)}%`
        );
    }

    if (auditData?.riskLevel) {
        notes.push(`Risk level: ${auditData.riskLevel}`);
    }

    return notes;
}

/**
 * Format incident report for display
 */
export function formatIncidentReport(report: IncidentReport): string {
    return `
LAPORAN FORENSIK INCIDENT

RINGKASAN:
${report.incident_summary}

TIMELINE:
${report.timeline.map((t, i) => `${i + 1}. ${t}`).join('\n')}

DETAIL:
- Rule: ${report.rule}
- Action: ${report.action}
- Rollback: ${report.rollback ? 'Ya' : 'Tidak'}
- System Behavior: ${report.system_behavior === 'correct' ? 'Correct' : 'Needs Review'}

CATATAN:
${report.notes.map(n => `• ${n}`).join('\n')}

---
Laporan ini dibuat berdasarkan audit logs sistem.
Tidak ada spekulasi atau assignment of blame.
  `.trim();
}
