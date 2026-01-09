import { NextRequest, NextResponse } from 'next/server';
import { runFailureSimulation, SimulationInput } from '@/lib/autonomous-analytics/simulations/failureEngine';

/**
 * POST /api/autonomous-analytics/simulations/failure
 * STRICT NON-PRODUCTION
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandId, assistedActionId, failureScenario, parameters } = body;

        if (!brandId || !assistedActionId || !failureScenario) {
            return NextResponse.json({
                error: 'GOVERNANCE_ERROR: brandId, assistedActionId, and failureScenario are required.'
            }, { status: 400 });
        }

        // Explicit Simulation Disclosure
        const report = await runFailureSimulation({
            brandId,
            assistedActionId,
            failureScenario,
            parameters: parameters || {}
        });

        return NextResponse.json({
            ...report,
            watermark: "SIMULATION — NO ACTION TAKEN",
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[FailureSimulation] API Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Simulation Error'
        }, { status: 500 });
    }
}
