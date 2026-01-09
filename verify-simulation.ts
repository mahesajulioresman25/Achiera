import { runFailureSimulation } from './src/lib/autonomous-analytics/simulations/failureEngine';
import { prisma } from './src/lib/prisma';

async function verifySimulation() {
    console.log('--- Phase 4.25 Verification Start ---');

    // 1. Get a valid Brand and AssistedAction template
    const brand = await prisma.brand.findFirst();
    if (!brand) throw new Error('No brand found.');

    // Create a mock template if none exists
    let action = await (prisma as any).assistedAction.findFirst();
    if (!action) {
        const suggestion = await (prisma as any).suggestionDraft.findFirst({ where: { brandId: brand.id } });
        if (!suggestion) throw new Error('No suggestion found to create action template.');

        action = await (prisma as any).assistedAction.create({
            data: {
                brandId: brand.id,
                suggestionId: suggestion.id,
                status: 'STAGED',
                payload: { value: 1000 },
                riskTier: 'LOW',
                reversalPlan: { steps: ['Undo change'] }
            }
        });
    }

    console.log('Action Template:', action.id);

    // 2. Run Simulation: INCORRECT_PAYLOAD
    const report = await runFailureSimulation({
        brandId: brand.id,
        assistedActionId: action.id,
        failureScenario: 'INCORRECT_PAYLOAD',
        parameters: { injectedValue: 9000, stressLevel: 'NORMAL' }
    });

    console.log('--- Simulation Report ---');
    console.log('ID:', report.simulationId);
    console.log('Type:', report.failureType);
    console.log('Risk:', report.residualRisk);
    console.log('Impact:', report.simulatedImpact);
    console.log('Rollback:', report.rollbackSuccess ? 'SUCCESS' : 'FAILED');

    // 3. Verify Database Persistence
    const saved = await (prisma as any).failureSimulation.findUnique({
        where: { simulationId: report.simulationId }
    });

    if (saved) {
        console.log('--- Audit Check ---');
        console.log('Database Log Found:', true);
        console.log('Repro Hash:', saved.reproducibilityHash);
    } else {
        console.error('Audit Log Missing from Database!');
    }

    console.log('--- Verification Complete ---');
}

verifySimulation().catch(console.error);
