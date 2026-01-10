import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { ConsolidationPeriod, ConsolidationStatus } from '@prisma/client';
import { InterCompanyService } from './InterCompanyService';

// Type Definitions
export interface ConsolidatedPL {
    totalRevenue: number;
    totalCOGS: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    byBrand: BrandPL[];
}

export interface BrandPL {
    brandId: string;
    brandName: string;
    revenue: number;
    cogs: number;
    expenses: number;
    netProfit: number;
}

export interface ConsolidatedBS {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    byBrand: BrandBS[];
}

export interface BrandBS {
    brandId: string;
    brandName: string;
    assets: number;
    liabilities: number;
    equity: number;
}

export interface ConsolidatedCF {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    byBrand: BrandCF[];
}

export interface BrandCF {
    brandId: string;
    brandName: string;
    operating: number;
    investing: number;
    financing: number;
}

export interface ICElimination {
    fromBrandId: string;
    toBrandId: string;
    amount: number;
    type: string;
    description: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class ConsolidationEngine {
    private icService: InterCompanyService;

    constructor() {
        this.icService = new InterCompanyService();
    }

    /**
     * Main consolidation method - generates complete consolidated statement
     */
    async generateConsolidatedStatement(
        fiscalYear: number,
        period: ConsolidationPeriod,
        executedBy: string
    ) {
        // Create consolidation log
        const log = await prisma.consolidationLog.create({
            data: {
                fiscalYear,
                period,
                status: 'RUNNING',
                brandsProcessed: 0,
                icEliminated: 0,
                executedBy
            }
        });

        try {
            // Calculate date range
            const { startDate, endDate } = this.getDateRange(fiscalYear, period);

            // Get all active brands
            const brands = await prisma.brand.findMany({
                where: { isActive: true }
            });

            // Consolidate P&L
            const pl = await this.consolidateProfitAndLoss(brands, startDate, endDate);

            // Consolidate Balance Sheet
            const bs = await this.consolidateBalanceSheet(brands, endDate);

            // Consolidate Cash Flow
            const cf = await this.consolidateCashFlow(brands, startDate, endDate);

            // Get IC eliminations
            const icTransactions = await this.icService.getICTransactionsForPeriod(
                startDate,
                endDate
            );
            const icEliminations = await this.eliminateInterCompanyTransactions(icTransactions);

            // Calculate IC elimination amount
            const icEliminationAmount = icEliminations.reduce((sum, e) => sum + e.amount, 0);

            // Create consolidated statement
            const statement = await prisma.consolidatedStatement.create({
                data: {
                    fiscalYear,
                    period,
                    startDate,
                    endDate,

                    // P&L
                    totalRevenue: pl.totalRevenue,
                    totalCOGS: pl.totalCOGS,
                    totalExpenses: pl.totalExpenses,
                    netProfit: pl.netProfit,

                    // BS
                    totalAssets: bs.totalAssets,
                    totalLiabilities: bs.totalLiabilities,
                    totalEquity: bs.totalEquity,

                    // CF
                    operatingCashFlow: cf.operatingCashFlow,
                    investingCashFlow: cf.investingCashFlow,
                    financingCashFlow: cf.financingCashFlow,

                    // IC
                    icEliminationAmount,
                    icTransactionCount: icEliminations.length,

                    // Details
                    plDetails: pl,
                    bsDetails: bs,
                    cfDetails: cf,
                    icEliminations: icEliminations,

                    generatedBy: executedBy
                }
            });

            // Update log
            await prisma.consolidationLog.update({
                where: { id: log.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    brandsProcessed: brands.length,
                    icEliminated: icEliminations.length,
                    statementId: statement.id
                }
            });

            return statement;
        } catch (error: any) {
            // Update log with error
            await prisma.consolidationLog.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    completedAt: new Date(),
                    errors: { message: error.message, stack: error.stack }
                }
            });
            throw error;
        }
    }

    /**
     * Consolidate Profit & Loss across all brands
     */
    async consolidateProfitAndLoss(
        brands: any[],
        startDate: Date,
        endDate: Date
    ): Promise<ConsolidatedPL> {
        const brandPLs: BrandPL[] = [];
        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalExpenses = 0;

        for (const brand of brands) {
            // Get journal entries for this brand in period
            const journals = await prisma.journalTransaction.findMany({
                where: {
                    brandId: brand.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: 'POSTED'
                },
                include: {
                    entries: {
                        include: {
                            account: true
                        }
                    }
                }
            });

            // Calculate P&L for this brand
            let revenue = 0;
            let cogs = 0;
            let expenses = 0;

            for (const journal of journals) {
                for (const entry of journal.entries) {
                    const amount = Number(entry.amount);
                    const accountType = entry.account.type;

                    if (accountType === 'REVENUE') {
                        revenue += entry.type === 'CREDIT' ? amount : -amount;
                    } else if (accountType === 'COGS') {
                        cogs += entry.type === 'DEBIT' ? amount : -amount;
                    } else if (accountType === 'EXPENSE') {
                        expenses += entry.type === 'DEBIT' ? amount : -amount;
                    }
                }
            }

            const netProfit = revenue - cogs - expenses;

            brandPLs.push({
                brandId: brand.id,
                brandName: brand.name,
                revenue,
                cogs,
                expenses,
                netProfit
            });

            totalRevenue += revenue;
            totalCOGS += cogs;
            totalExpenses += expenses;
        }

        // Get IC transactions to eliminate
        const icTransactions = await this.icService.getICTransactionsForPeriod(startDate, endDate);

        // Eliminate IC revenue/expenses
        for (const ic of icTransactions) {
            if (ic.type === 'SERVICE_FEE' || ic.type === 'MATERIAL_TRANSFER') {
                const amount = Number(ic.amount);
                totalRevenue -= amount; // Remove IC revenue
                totalExpenses -= amount; // Remove IC expense
            }
        }

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = totalRevenue - totalCOGS - totalExpenses;

        return {
            totalRevenue,
            totalCOGS,
            totalExpenses,
            grossProfit,
            netProfit,
            byBrand: brandPLs
        };
    }

    /**
     * Consolidate Balance Sheet across all brands
     */
    async consolidateBalanceSheet(
        brands: any[],
        asOfDate: Date
    ): Promise<ConsolidatedBS> {
        const brandBSs: BrandBS[] = [];
        let totalAssets = 0;
        let totalLiabilities = 0;

        for (const brand of brands) {
            // Get all accounts for this brand
            const accounts = await prisma.ledgerAccount.findMany({
                where: { brandId: brand.id },
                include: {
                    journalEntries: {
                        where: {
                            transaction: {
                                date: { lte: asOfDate },
                                status: 'POSTED'
                            }
                        }
                    }
                }
            });

            let assets = 0;
            let liabilities = 0;

            for (const account of accounts) {
                let balance = 0;
                for (const entry of account.journalEntries) {
                    const amount = Number(entry.amount);
                    balance += entry.type === 'DEBIT' ? amount : -amount;
                }

                if (account.type === 'ASSET') {
                    assets += balance;
                } else if (account.type === 'LIABILITY') {
                    liabilities += Math.abs(balance);
                }
            }

            const equity = assets - liabilities;

            brandBSs.push({
                brandId: brand.id,
                brandName: brand.name,
                assets,
                liabilities,
                equity
            });

            totalAssets += assets;
            totalLiabilities += liabilities;
        }

        // Eliminate IC receivables/payables
        const icBalances = await this.icService.getICBalances();
        for (const balance of icBalances) {
            const amount = Math.abs(Number(balance.balance));
            totalAssets -= amount; // Remove IC receivables
            totalLiabilities -= amount; // Remove IC payables
        }

        const totalEquity = totalAssets - totalLiabilities;

        return {
            totalAssets,
            totalLiabilities,
            totalEquity,
            byBrand: brandBSs
        };
    }

    /**
     * Consolidate Cash Flow across all brands (Indirect Method)
     */
    async consolidateCashFlow(
        brands: any[],
        startDate: Date,
        endDate: Date
    ): Promise<ConsolidatedCF> {
        const brandCFs: BrandCF[] = [];
        let totalOperating = 0;
        let totalInvesting = 0;
        let totalFinancing = 0;

        for (const brand of brands) {
            // For now, use simplified cash flow calculation
            // In production, this should use actual cash flow statement logic

            // Operating CF ≈ Net Profit + Depreciation - Working Capital changes
            const journals = await prisma.journalTransaction.findMany({
                where: {
                    brandId: brand.id,
                    date: { gte: startDate, lte: endDate },
                    status: 'POSTED'
                },
                include: {
                    entries: {
                        include: { account: true }
                    }
                }
            });

            let operating = 0;
            let investing = 0;
            let financing = 0;

            for (const journal of journals) {
                for (const entry of journal.entries) {
                    const amount = Number(entry.amount);
                    const debitAmount = entry.type === 'DEBIT' ? amount : -amount;

                    // Simplified classification
                    if (entry.account.type === 'ASSET' && entry.account.name.includes('Fixed')) {
                        investing += debitAmount;
                    } else if (entry.account.type === 'LIABILITY' && entry.account.name.includes('Loan')) {
                        financing += debitAmount;
                    } else {
                        operating += debitAmount;
                    }
                }
            }

            brandCFs.push({
                brandId: brand.id,
                brandName: brand.name,
                operating,
                investing,
                financing
            });

            totalOperating += operating;
            totalInvesting += investing;
            totalFinancing += financing;
        }

        return {
            operatingCashFlow: totalOperating,
            investingCashFlow: totalInvesting,
            financingCashFlow: totalFinancing,
            netCashFlow: totalOperating + totalInvesting + totalFinancing,
            byBrand: brandCFs
        };
    }

    /**
     * Eliminate inter-company transactions
     */
    async eliminateInterCompanyTransactions(
        transactions: any[]
    ): Promise<ICElimination[]> {
        const eliminations: ICElimination[] = [];

        for (const tx of transactions) {
            if (tx.status === 'APPROVED') {
                eliminations.push({
                    fromBrandId: tx.fromBrandId,
                    toBrandId: tx.toBrandId,
                    amount: Number(tx.amount),
                    type: tx.type,
                    description: tx.description
                });
            }
        }

        return eliminations;
    }

    /**
     * Validate consolidated statement
     */
    async validateConsolidation(statement: any): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate Balance Sheet balances
        const bsBalance = statement.totalAssets - statement.totalLiabilities - statement.totalEquity;
        if (Math.abs(bsBalance) > 0.01) {
            errors.push(`Balance Sheet doesn't balance: Assets - Liabilities - Equity = ${bsBalance}`);
        }

        // Validate Cash Flow reconciliation
        const cfTotal = statement.operatingCashFlow + statement.investingCashFlow + statement.financingCashFlow;
        if (Math.abs(cfTotal) < 1) {
            warnings.push('Net cash flow is near zero, verify cash flow calculations');
        }

        // Validate IC eliminations
        if (statement.icTransactionCount === 0) {
            warnings.push('No inter-company transactions eliminated');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get date range for consolidation period
     */
    private getDateRange(fiscalYear: number, period: ConsolidationPeriod): { startDate: Date; endDate: Date } {
        let startDate: Date;
        let endDate: Date;

        switch (period) {
            case 'ANNUAL':
                startDate = new Date(fiscalYear, 0, 1);
                endDate = new Date(fiscalYear, 11, 31);
                break;
            case 'QUARTERLY':
                // Default to Q4
                startDate = new Date(fiscalYear, 9, 1);
                endDate = new Date(fiscalYear, 11, 31);
                break;
            case 'MONTHLY':
                // Default to December
                startDate = new Date(fiscalYear, 11, 1);
                endDate = new Date(fiscalYear, 11, 31);
                break;
            case 'YTD':
                startDate = new Date(fiscalYear, 0, 1);
                endDate = new Date();
                break;
        }

        return { startDate, endDate };
    }
}
