import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { ConsolidationPeriod } from '@prisma/client';
import { ConsolidationEngine } from './ConsolidationEngine';

export interface StatementComparison {
    current: any;
    previous: any;
    variance: {
        revenue: { amount: number; percentage: number };
        netProfit: { amount: number; percentage: number };
        assets: { amount: number; percentage: number };
        equity: { amount: number; percentage: number };
    };
}

export class FinancialStatementService {
    private consolidationEngine: ConsolidationEngine;
    private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in ms

    constructor() {
        this.consolidationEngine = new ConsolidationEngine();
    }

    /**
     * Get brand-level P&L statement
     */
    async getBrandPL(brandId: string, startDate: Date, endDate: Date) {
        const journals = await prisma.journalTransaction.findMany({
            where: {
                brandId,
                date: { gte: startDate, lte: endDate }
                // status: 'POSTED'
            },
            include: {
                entries: {
                    include: { account: true }
                }
            }
        });

        let revenue = 0;
        let cogs = 0;
        let expenses = 0;

        for (const journal of journals) {
            for (const entry of journal.entries) {
                const debit = Number(entry.debit);
                const credit = Number(entry.credit);
                const accountType = entry.account.type;

                if (accountType === 'REVENUE') {
                    revenue += (credit - debit);
                } else if (accountType === 'EXPENSE') {
                    // Simple heuristic for COGS if needed, or just group into expenses
                    if (entry.account.name.toUpperCase().includes('COGS') || entry.account.name.toUpperCase().includes('HPP')) {
                        cogs += (debit - credit);
                    } else {
                        expenses += (debit - credit);
                    }
                }
            }
        }

        return {
            revenue,
            cogs,
            expenses,
            grossProfit: revenue - cogs,
            netProfit: revenue - cogs - expenses
        };
    }

    /**
     * Get brand-level Balance Sheet
     */
    async getBrandBS(brandId: string, asOfDate: Date) {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId },
            include: {
                entries: {
                    where: {
                        transaction: {
                            date: { lte: asOfDate }
                            // status: 'POSTED' // Status field might be missing
                        }
                    }
                }
            }
        });

        let assets = 0;
        let liabilities = 0;

        for (const account of accounts) {
            let balance = 0;
            for (const entry of account.entries) {
                const debit = Number(entry.debit);
                const credit = Number(entry.credit);

                // Calculate balance based on normal balance type
                if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                    balance += (debit - credit);
                } else {
                    balance += (credit - debit);
                }
            }

            if (account.type === 'ASSET') {
                assets += balance;
            } else if (account.type === 'LIABILITY') {
                liabilities += balance;
            }
            // Equity is calculated as Assets - Liabilities in return statement, 
            // or we could sum equity accounts here.
        }

        return {
            assets,
            liabilities,
            equity: assets - liabilities
        };
    }

    /**
     * Get brand-level Cash Flow
     */
    async getBrandCF(brandId: string, startDate: Date, endDate: Date) {
        // Simplified cash flow - in production, use proper cash flow statement logic
        const pl = await this.getBrandPL(brandId, startDate, endDate);

        return {
            operating: pl.netProfit, // Simplified: operating CF ≈ net profit
            investing: 0, // Would need asset purchase/sale data
            financing: 0, // Would need loan/equity data
            netCashFlow: pl.netProfit
        };
    }

    /**
     * Get consolidated statement (with caching)
     */
    async getConsolidatedStatement(fiscalYear: number, period: ConsolidationPeriod) {
        // Check if statement exists and is fresh
        const existing = await prisma.consolidatedStatement.findUnique({
            where: {
                fiscalYear_period: {
                    fiscalYear,
                    period
                }
            }
        });

        if (existing) {
            const age = Date.now() - existing.generatedAt.getTime();
            if (age < this.cacheExpiry) {
                return existing;
            }
        }

        // Statement doesn't exist or is stale - return null
        // User must explicitly generate new statement
        return null;
    }

    /**
     * Generate new consolidated statement
     */
    async generateConsolidatedStatement(
        fiscalYear: number,
        period: ConsolidationPeriod,
        executedBy: string
    ) {
        // Delete existing statement if any
        await prisma.consolidatedStatement.deleteMany({
            where: { fiscalYear, period }
        });

        // Generate new statement
        return await this.consolidationEngine.generateConsolidatedStatement(
            fiscalYear,
            period,
            executedBy
        );
    }

    /**
     * Compare two statements
     */
    async compareStatements(
        currentYear: number,
        currentPeriod: ConsolidationPeriod,
        previousYear: number,
        previousPeriod: ConsolidationPeriod
    ): Promise<StatementComparison | null> {
        const [current, previous] = await Promise.all([
            this.getConsolidatedStatement(currentYear, currentPeriod),
            this.getConsolidatedStatement(previousYear, previousPeriod)
        ]);

        if (!current || !previous) {
            return null;
        }

        const calculateVariance = (current: number, previous: number) => {
            const amount = current - previous;
            const percentage = previous !== 0 ? (amount / previous) * 100 : 0;
            return { amount, percentage };
        };

        return {
            current,
            previous,
            variance: {
                revenue: calculateVariance(
                    Number(current.totalRevenue),
                    Number(previous.totalRevenue)
                ),
                netProfit: calculateVariance(
                    Number(current.netProfit),
                    Number(previous.netProfit)
                ),
                assets: calculateVariance(
                    Number(current.totalAssets),
                    Number(previous.totalAssets)
                ),
                equity: calculateVariance(
                    Number(current.totalEquity),
                    Number(previous.totalEquity)
                )
            }
        };
    }

    /**
     * Get all consolidated statements
     */
    async getAllStatements(limit: number = 10) {
        return await prisma.consolidatedStatement.findMany({
            orderBy: [
                { fiscalYear: 'desc' },
                { period: 'desc' }
            ],
            take: limit
        });
    }

    /**
     * Get consolidation logs
     */
    async getConsolidationLogs(limit: number = 20) {
        return await prisma.consolidationLog.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit
        });
    }

    /**
     * Delete old statements (retention policy)
     */
    async cleanupOldStatements(yearsToKeep: number = 7) {
        const cutoffYear = new Date().getFullYear() - yearsToKeep;

        const deleted = await prisma.consolidatedStatement.deleteMany({
            where: {
                fiscalYear: { lt: cutoffYear }
            }
        });

        return deleted.count;
    }
}
