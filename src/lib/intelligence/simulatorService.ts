import { prisma } from '@/lib/prisma';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface SimulationResult {
    date: string;
    baseline: number;
    simulated: number;
}

export interface ScenarioImpact {
    brandId: string;
    brandName: string;
    currentCash: number;
    projectedCash3Months: number;
    impactType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class CFOSimulatorService {
    /**
     * Projects cash flow for a brand over 3 months
     */
    static async projectCashFlow(
        brandId: string,
        simulatedTransfer?: { amount: number; type: 'IN' | 'OUT' }
    ): Promise<SimulationResult[]> {
        // 1. Get average monthly revenue & expenses for the last 3 months
        const threeMonthsAgo = addMonths(new Date(), -3);

        const journalEntries = await (prisma as any).journalEntry.findMany({
            where: {
                account: { brandId },
                createdAt: { gte: threeMonthsAgo }
            },
            include: { account: true }
        });

        // Simplified calculation of monthly burn rate / growth
        const monthlyInflow = journalEntries
            .filter((e: any) => e.account.type === 'REVENUE')
            .reduce((sum: number, e: any) => sum + Number(e.credit || 0), 0) / 3;

        const monthlyOutflow = journalEntries
            .filter((e: any) => e.account.type === 'EXPENSE')
            .reduce((sum: number, e: any) => sum + Number(e.debit || 0), 0) / 3;

        const netMonthly = monthlyInflow - monthlyOutflow;

        // 2. Get current cash position
        const cashAccounts = await (prisma as any).ledgerAccount.findMany({
            where: { brandId, type: 'ASSET', name: { contains: 'Cash' } }
        });
        const currentCash = cashAccounts.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

        // 3. Generate projection for next 3 months
        const results: SimulationResult[] = [];
        let currentBaseline = currentCash;
        let currentSimulated = currentCash + (simulatedTransfer ? (simulatedTransfer.type === 'IN' ? simulatedTransfer.amount : -simulatedTransfer.amount) : 0);

        // Month 0 (Current)
        results.push({
            date: format(new Date(), 'MMM yyyy'),
            baseline: currentBaseline,
            simulated: currentSimulated
        });

        for (let i = 1; i <= 3; i++) {
            currentBaseline += netMonthly;
            currentSimulated += netMonthly;

            results.push({
                date: format(addMonths(new Date(), i), 'MMM yyyy'),
                baseline: currentBaseline,
                simulated: currentSimulated
            });
        }

        return results;
    }

    /**
     * Run a multi-brand simulation for a capital transfer
     */
    static async simulateTransfer(
        fromBrandId: string,
        toBrandId: string,
        amount: number
    ) {
        const [fromImpact, toImpact] = await Promise.all([
            this.projectCashFlow(fromBrandId, { amount, type: 'OUT' }),
            this.projectCashFlow(toBrandId, { amount, type: 'IN' })
        ]);

        return {
            fromBrand: fromImpact,
            toBrand: toImpact,
            summary: {
                isSafe: fromImpact[3].simulated > 0, // Is the source brand solvent after 3 months?
                recommended: fromImpact[3].simulated > (fromImpact[0].baseline * 0.2) // Recommended if still has 20% buffer
            }
        };
    }
}
