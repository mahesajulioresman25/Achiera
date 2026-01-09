import { NextRequest, NextResponse } from 'next/server';
import { assistedActionService } from '@/lib/autonomous-analytics/actions/assistedActionService';

/**
 * POST /api/autonomous-analytics/assisted-actions
 * Handles: PROMOTION, FINALIZATION, APPROVAL, EXECUTION, REVERT
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ...params } = body;

        let result;

        switch (action) {
            case 'PROMOTE':
                result = await assistedActionService.promoteSuggestion(params.suggestionId);
                break;

            case 'FINALIZE':
                result = await assistedActionService.finalizePayload(params.actionId, params.payload);
                break;

            case 'APPROVE':
                result = await assistedActionService.submitApproval(
                    params.actionId,
                    params.operatorId,
                    params.role,
                    params.acknowledgment
                );
                break;

            case 'EXECUTE':
                result = await assistedActionService.executeAction(params.actionId, params.operatorId);
                break;

            case 'REVERT':
                result = await assistedActionService.revertAction(params.actionId, params.operatorId);
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[AssistedActions] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
