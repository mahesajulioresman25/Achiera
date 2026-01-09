import { NextRequest, NextResponse } from 'next/server';
import { runSimulation } from '@/lib/autonomous-analytics/simulation-engine';
import { DecisionInput } from '@/lib/autonomous-analytics/types/decision';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { brandId, ruleIds, inputContext } = body;

        console.log(`[API] Simulation requested for brandId: ${brandId}`);

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Prepare simulation input
        const input: DecisionInput = {
            brandId,
            ruleIds,
            manualContext: inputContext,
            triggerSource: 'MANUAL_SIMULATION'
        };

        // Run the simulation (Dry-run, zero DB mutations)
        const result = await runSimulation(input);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error running simulation:', error);
        return NextResponse.json(
            { error: 'Failed to run simulation', details: String(error) },
            { status: 500 }
        );
    }
}
