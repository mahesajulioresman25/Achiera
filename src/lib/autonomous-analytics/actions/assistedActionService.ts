import { prisma } from '@/lib/prisma';

export type ActionStatus = 'STAGED' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REVERTING' | 'REVERTED';

export interface AssistedActionService {
    promoteSuggestion: (suggestionId: string) => Promise<any>;
    finalizePayload: (actionId: string, payload: any) => Promise<any>;
    submitApproval: (actionId: string, operatorId: string, role: string, acknowledgment: string) => Promise<any>;
    executeAction: (actionId: string, operatorId: string) => Promise<any>;
    revertAction: (actionId: string, operatorId: string) => Promise<any>;
}

export const assistedActionService = {
    /**
     * Promotes a Suggestion to a STAGED AssistedAction.
     * Human trigger required.
     */
    async promoteSuggestion(suggestionId: string) {
        const suggestion = await (prisma as any).suggestionDraft.findUnique({
            where: { id: suggestionId }
        });

        if (!suggestion) throw new Error('Suggestion not found');

        return await (prisma as any).assistedAction.create({
            data: {
                suggestionId,
                brandId: suggestion.brandId,
                status: 'STAGED',
                payload: suggestion.proposedAction, // Initial payload from suggestion
                riskTier: suggestion.riskLevel,
                reversalPlan: { steps: [`Revert ${suggestion.title}`] }
            }
        });
    },

    /**
     * Finalizes payload and moves to PENDING_APPROVAL.
     */
    async finalizePayload(actionId: string, payload: any) {
        return await (prisma as any).assistedAction.update({
            where: { id: actionId },
            data: {
                payload,
                status: 'PENDING_APPROVAL'
            }
        });
    },

    /**
     * Submits an approval signature.
     * Checks for governance requirements (e.g. CFO for HIGH risk).
     */
    async submitApproval(actionId: string, operatorId: string, role: string, acknowledgment: string) {
        const action = await (prisma as any).assistedAction.findUnique({
            where: { id: actionId },
            include: { approvals: true }
        });

        if (!action) throw new Error('Action not found');

        // Create Approval
        await (prisma as any).actionApproval.create({
            data: {
                actionId,
                operatorId,
                role,
                acknowledgment
            }
        });

        // Check if fully approved
        const updatedAction = await (prisma as any).assistedAction.findUnique({
            where: { id: actionId },
            include: { approvals: true }
        });

        const roles = updatedAction.approvals.map((a: any) => a.role);

        let isFullyApproved = false;
        if (action.riskTier === 'HIGH') {
            isFullyApproved = roles.includes('CFO') && roles.includes('BOARD');
        } else {
            isFullyApproved = roles.includes('OPERATOR') || roles.includes('CFO');
        }

        if (isFullyApproved) {
            return await (prisma as any).assistedAction.update({
                where: { id: actionId },
                data: { status: 'APPROVED' }
            });
        }

        return updatedAction;
    },

    /**
     * FINAL HUMAN TRIGGER for execution.
     * NO AUTO-EXECUTION ALLOWED.
     */
    async executeAction(actionId: string, operatorId: string) {
        const action = await (prisma as any).assistedAction.findUnique({
            where: { id: actionId }
        });

        if (action.status !== 'APPROVED') {
            throw new Error(`GOVERNANCE_ERROR: Action status [${action.status}] is not APPROVED.`);
        }

        // Move to EXECUTING
        await (prisma as any).assistedAction.update({
            where: { id: actionId },
            data: { status: 'EXECUTING' }
        });

        try {
            // SIMULATED EXECUTION (Phase 4 is still non-autonomous in real side effects, 
            // but this function represents the conduit).
            // In Phase 5, this would call external APIs.
            console.log(`[EXECUTION] Applying payload to system:`, action.payload);

            // Update to COMPLETED
            return await (prisma as any).assistedAction.update({
                where: { id: actionId },
                data: { status: 'COMPLETED' }
            });
        } catch (error) {
            await (prisma as any).assistedAction.update({
                where: { id: actionId },
                data: { status: 'FAILED' }
            });
            throw error;
        }
    },

    /**
     * Manual Rollback
     */
    async revertAction(actionId: string, operatorId: string) {
        await (prisma as any).assistedAction.update({
            where: { id: actionId },
            data: { status: 'REVERTING' }
        });

        try {
            console.log(`[ROLLBACK] Reversing action:`, actionId);

            return await (prisma as any).assistedAction.update({
                where: { id: actionId },
                data: { status: 'REVERTED' }
            });
        } catch (error) {
            // If rollback fails, system enters critical state
            throw new Error(`FATAL: Rollback failed for action ${actionId}`);
        }
    }
};
