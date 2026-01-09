import { assistedActionService } from './src/lib/autonomous-analytics/actions/assistedActionService';
import { prisma } from './src/lib/prisma';

async function verifyAssistedMode() {
    console.log('--- Phase 4.0 Verification Start ---');

    // 1. Find a suggestion to promote
    const brand = await prisma.brand.findFirst();
    const suggestion = await (prisma as any).suggestionDraft.findFirst({ where: { brandId: brand.id } });

    if (!suggestion) throw new Error('No suggestion found.');

    console.log('Promoting Suggestion:', suggestion.id);
    const action = await assistedActionService.promoteSuggestion(suggestion.id);
    console.log('Staged Action ID:', action.id, '| Status:', action.status);

    // 2. Finalize Payload
    const finalized = await assistedActionService.finalizePayload(action.id, { ...action.payload, verified: true });
    console.log('Status after Finalize:', finalized.status);

    // 3. Approval Flow (Simulation)
    console.log('Submitting CFO Approval...');
    const approved = await assistedActionService.submitApproval(
        action.id,
        'CFO_USER_123',
        'CFO',
        'I acknowledge the risk.'
    );
    console.log('Status after CFO Approval:', approved.status);

    // 4. Execution (Should fail if risk is HIGH and BOARD signature is missing, or succeed if LOW)
    try {
        console.log('Attempting Final Human Trigger...');
        const result = await assistedActionService.executeAction(action.id, 'OPERATOR_123');
        console.log('Execution Result:', result.status);
    } catch (err: any) {
        console.log('Execution Blocked (Expected for HIGH risk without BOARD):', err.message);
    }

    // 5. Cleanup
    console.log('--- Verification Complete ---');
}

verifyAssistedMode().catch(console.error);
