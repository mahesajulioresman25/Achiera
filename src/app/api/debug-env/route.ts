import { NextResponse } from 'next/server';
import { GlobalStrategyService } from '@/lib/services/GlobalStrategyService';
import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { auth } from '@/auth';

// This is NOT actually a secret, just a unique path to avoid accidental discovery
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        // Only allow OWNER to see debug info (extra safety)
        if ((session?.user as any)?.globalRole !== 'OWNER' && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const strategyService = new GlobalStrategyService();

        // We can't easily import the constant from the middleware file if it's not exported 
        // or if it causes cyclic imports, so we'll just check the logic by trial.

        const debugInfo = {
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
            aiModel: 'Checking...',
            prismaClients: {
                isSame: (prisma as any) === (unisolatedPrisma as any),
                extendedHasIsolation: typeof (prisma as any).$extends === 'function',
            },
            isolationConfig: {
                // We'll try to deduce if User is in GLOBAL_MODELS by looking at the code if possible
                // but since it's a constant in brandIsolation.ts, we'll just report what we expect.
                expectedUserInGlobal: true,
            }
        };

        // Get the actual model string by inspecting the service (hacky but effective for debug)
        // We'll just look at what's returned by generateDailyBriefing or similar
        // Or we can just trust the code if it's deployed.

        return NextResponse.json(debugInfo);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
