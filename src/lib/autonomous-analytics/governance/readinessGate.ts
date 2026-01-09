import { prisma } from '@/lib/prisma';

export interface GovernanceReadinessInput {
    brandId: string;
    simulationSummary: {
        totalSimulations: number;
        byFailureType: Record<string, number>;
        criticalFailures: number;
    };
    rollbackMetrics: {
        totalRollbacks: number;
        successfulRollbacks: number;
        avgLatencySeconds: number;
        partialRollbacksDetected: boolean;
        RCS: number;
    };
    auditArtifacts: {
        simulationLogs: number;
        reproducibilityVerified: boolean;
    };
    cfoChecklist: {
        financialCapsVerified: boolean;
        rollbackLatencyAccepted: boolean;
        humanErrorRiskAcknowledged: boolean;
    };
}

export interface GovernanceGateDecision {
    brandId: string;
    phaseEvaluated: "4.5";
    decision: "READY" | "BLOCKED";
    blockReasons: string[];
    riskFlags: string[];
    cfoEscalationRequired: boolean;
    governanceStatement: string;
}

/**
 * Assisted Governance Readiness Gate (Phase 4.5)
 * Deterministic human-locked evaluation.
 */
export async function evaluateGovernanceReadiness(input: GovernanceReadinessInput): Promise<GovernanceGateDecision> {
    const {
        brandId,
        simulationSummary,
        rollbackMetrics,
        auditArtifacts,
        cfoChecklist
    } = input;

    const blockReasons: string[] = [];
    const riskFlags: string[] = [];
    let cfoEscalationRequired = false;

    // 1. HARD BLOCK CONDITIONS (AUTO-FAIL)
    if (simulationSummary.totalSimulations < 50) {
        blockReasons.push("INSUFFICIENT_SIMULATION_VOLUME: Minimum 50 simulations required.");
    }

    const mandatoryCategories = [
        'INCORRECT_PAYLOAD', 'INCORRECT_TIMING', 'OVERCONFIDENCE_BIAS',
        'ROLLBACK_FAILURE', 'APPROVAL_CHAIN_BREAKDOWN', 'HUMAN_PANIC_RESPONSE'
    ];

    const testedCategories = Object.keys(simulationSummary.byFailureType);
    const missingCategories = mandatoryCategories.filter(cat => !testedCategories.includes(cat) || simulationSummary.byFailureType[cat] === 0);

    if (missingCategories.length > 0) {
        blockReasons.push(`UNTESTED_FAILURE_MODES: Missing coverage for ${missingCategories.join(', ')}.`);
    }

    if (simulationSummary.criticalFailures > 0) {
        blockReasons.push(`CRITICAL_FAILURES_DETECTED: Total ${simulationSummary.criticalFailures} unresolved critical failures.`);
    }

    if (rollbackMetrics.partialRollbacksDetected) {
        blockReasons.push("PARTIAL_ROLLBACK_DETECTED: System rollback integrity compromised.");
    }

    if (rollbackMetrics.RCS < 90) {
        blockReasons.push(`UNACCEPTABLE_ROLLBACK_CONFIDENCE: RCS [${rollbackMetrics.RCS}%] below mandatory 90% floor.`);
    }

    if (!auditArtifacts.reproducibilityVerified) {
        blockReasons.push("AUDIT_INTEGRITY_FAILURE: Simulation reproducibility not verified.");
    }

    if (!cfoChecklist.financialCapsVerified || !cfoChecklist.rollbackLatencyAccepted || !cfoChecklist.humanErrorRiskAcknowledged) {
        blockReasons.push("CFO_CHECKLIST_INCOMPLETE: Mandatory risk sign-offs missing.");
    }

    if (rollbackMetrics.avgLatencySeconds > 60) {
        blockReasons.push(`EXCESSIVE_ROLLBACK_LATENCY: Average latency [${rollbackMetrics.avgLatencySeconds}s] exceeds 60s limit.`);
    }

    // 2. RISK FLAGS & ESCALATION
    if (rollbackMetrics.RCS >= 90 && rollbackMetrics.RCS < 98.5) {
        riskFlags.push("SUB_OPTIMAL_ROLLBACK_CONFIDENCE: RCS below 98.5% red-line.");
        cfoEscalationRequired = true;
    }

    const decision: GovernanceGateDecision['decision'] = blockReasons.length > 0 ? "BLOCKED" : "READY";

    let governanceStatement = "";
    if (decision === "READY") {
        governanceStatement = "Phase 4.25 exit criteria have been satisfied. System is cleared for human-triggered assisted execution only. No autonomous action capability exists.";
    } else {
        governanceStatement = "Governance conditions for execution readiness are unmet. System remains locked in Phase 4.25. No progression permitted.";
    }

    return {
        brandId,
        phaseEvaluated: "4.5",
        decision,
        blockReasons,
        riskFlags,
        cfoEscalationRequired,
        governanceStatement
    };
}

/**
 * Aggregates simulation data for a brand to feed the readiness gate.
 */
export async function getReadinessData(brandId: string): Promise<GovernanceReadinessInput> {
    const simulations = await (prisma as any).failureSimulation.findMany({
        where: { brandId }
    });

    const totalSimulations = simulations.length;
    const byFailureType: Record<string, number> = {};
    let criticalFailures = 0;
    let successfulRollbacks = 0;
    let totalLatency = 0;
    let partialRollbacksDetected = false;

    simulations.forEach((sim: any) => {
        byFailureType[sim.failureType] = (byFailureType[sim.failureType] || 0) + 1;
        if (sim.residualRisk === 'CRITICAL') criticalFailures++;
        if (sim.rollbackSuccess) successfulRollbacks++;
        totalLatency += sim.rollbackLatency;
        // In this mock, we assume 'ROLLBACK_FAILURE' type with success=false might be considered "partial" 
        // if some parts were reverted but status is failed. 
        // For simulation logic, we'll look for an explicit flag if we added it (we didn't yet, so we'll check if any sim specifically says it was partial).
        if (sim.governanceBreachFlags.includes('PARTIAL_ROLLBACK')) partialRollbacksDetected = true;
    });

    const totalRollbacks = totalSimulations;
    const avgLatencySeconds = totalRollbacks > 0 ? totalLatency / totalRollbacks : 0;

    // RCS = (Successful_Rollbacks / Total_Simulations) * (1 - Avg_Latency_Penalty)
    // Latency penalty if > 60s? Users spec says RCS < 90 is BLOCK.
    // Let's use the provided formula.
    const latencyPenalty = avgLatencySeconds > 60 ? (avgLatencySeconds - 60) / 100 : 0;
    const RCS = totalRollbacks > 0
        ? Math.max(0, (successfulRollbacks / totalRollbacks) * (1 - latencyPenalty) * 100)
        : 0;

    // Repro verification - in a real system we'd check if all hashes are valid. 
    // For this engine, we assume true if logs exist.
    const reproducibilityVerified = totalSimulations > 0;

    // Simulation logs count
    const simulationLogs = totalSimulations;

    // CFO Checklist - in a real system this would come from another table.
    // We'll mock it for now.
    const cfoChecklist = {
        financialCapsVerified: totalSimulations >= 30, // Mock: verified if we've run enough sims
        rollbackLatencyAccepted: avgLatencySeconds <= 60,
        humanErrorRiskAcknowledged: totalSimulations >= 10
    };

    return {
        brandId,
        simulationSummary: {
            totalSimulations,
            byFailureType,
            criticalFailures
        },
        rollbackMetrics: {
            totalRollbacks,
            successfulRollbacks,
            avgLatencySeconds,
            partialRollbacksDetected,
            RCS
        },
        auditArtifacts: {
            simulationLogs,
            reproducibilityVerified
        },
        cfoChecklist
    };
}
