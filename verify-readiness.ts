import { evaluateGovernanceReadiness, GovernanceReadinessInput } from './src/lib/autonomous-analytics/governance/readinessGate';

async function verifyReadinessGate() {
    console.log('--- Phase 4.5 Verification Start ---');

    // TEST CASE 1: BLOCKED (Low Volume)
    const lowVolumeInput: GovernanceReadinessInput = {
        brandId: 'brand_123',
        simulationSummary: {
            totalSimulations: 45, // < 50
            byFailureType: { 'INCORRECT_PAYLOAD': 10 },
            criticalFailures: 0
        },
        rollbackMetrics: {
            totalRollbacks: 45,
            successfulRollbacks: 45,
            avgLatencySeconds: 30,
            partialRollbacksDetected: false,
            RCS: 100
        },
        auditArtifacts: {
            simulationLogs: 45,
            reproducibilityVerified: true
        },
        cfoChecklist: {
            financialCapsVerified: true,
            rollbackLatencyAccepted: true,
            humanErrorRiskAcknowledged: true
        }
    };

    const decision1 = await evaluateGovernanceReadiness(lowVolumeInput);
    console.log('Test 1 (Low Volume):', decision1.decision, '| Reasons:', decision1.blockReasons[0]);

    // TEST CASE 2: READY (High Confidence)
    const readyInput: GovernanceReadinessInput = {
        brandId: 'brand_123',
        simulationSummary: {
            totalSimulations: 60,
            byFailureType: {
                'INCORRECT_PAYLOAD': 10,
                'INCORRECT_TIMING': 10,
                'OVERCONFIDENCE_BIAS': 10,
                'ROLLBACK_FAILURE': 10,
                'APPROVAL_CHAIN_BREAKDOWN': 10,
                'HUMAN_PANIC_RESPONSE': 10
            },
            criticalFailures: 0
        },
        rollbackMetrics: {
            totalRollbacks: 60,
            successfulRollbacks: 60,
            avgLatencySeconds: 25,
            partialRollbacksDetected: false,
            RCS: 99.5
        },
        auditArtifacts: {
            simulationLogs: 60,
            reproducibilityVerified: true
        },
        cfoChecklist: {
            financialCapsVerified: true,
            rollbackLatencyAccepted: true,
            humanErrorRiskAcknowledged: true
        }
    };

    const decision2 = await evaluateGovernanceReadiness(readyInput);
    console.log('Test 2 (Optimal):', decision2.decision);
    console.log('Statement:', decision2.governanceStatement);

    // TEST CASE 3: READY WITH ESCALATION (RCS between 90-98.5)
    const escalationInput: GovernanceReadinessInput = {
        ...readyInput,
        rollbackMetrics: {
            ...readyInput.rollbackMetrics,
            RCS: 92.5
        }
    };

    const decision3 = await evaluateGovernanceReadiness(escalationInput);
    console.log('Test 3 (Escalation):', decision3.decision, '| Escalation Required:', decision3.cfoEscalationRequired);

    console.log('--- Verification Complete ---');
}

verifyReadinessGate().catch(console.error);
