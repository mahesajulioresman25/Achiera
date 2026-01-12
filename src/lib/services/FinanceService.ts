// ACHIERA Platform - Finance Service
// Double-entry ledger and financial reporting

import { prisma } from '@/lib/prisma';
import type { ServiceContext } from './WarehouseService';

export type RecordRevenueInput = {
    orderId: string;
    amount: number;
    description?: string;
};

export type RecordExpenseInput = {
    amount: number;
    category: string; // COGS, MARKETING, OPERATIONS
    description: string;
    referenceId?: string;
};

export class FinanceService {
    /**
     * Record revenue from order (double-entry)
     */
    async recordRevenue(
        tx: any,
        brandId: string,
        input: RecordRevenueInput
    ) {
        const cashAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '1-1001' } // Kas Besar
        });

        const revenueAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '4-1000' } // Pendapatan Makanan/Utama
        });

        if (!cashAccount || !revenueAccount) {
            throw new Error('Ledger accounts not configured. Please run setup.');
        }

        // Create transaction
        const transaction = await tx.journalTransaction.create({
            data: {
                brandId,
                referenceId: input.orderId,
                description: input.description || `Revenue from Order`,
                date: new Date()
            }
        });

        // Debit: Cash (increase asset)
        await tx.journalEntry.create({
            data: {
                brandId,
                transactionId: transaction.id,
                accountId: cashAccount.id,
                debit: input.amount,
                credit: 0
            }
        });

        // Credit: Revenue (increase revenue)
        await tx.journalEntry.create({
            data: {
                brandId,
                transactionId: transaction.id,
                accountId: revenueAccount.id,
                debit: 0,
                credit: input.amount
            }
        });

        return transaction;
    }

    /**
     * Record expense (double-entry)
     */
    async recordExpense(
        ctx: ServiceContext,
        input: RecordExpenseInput
    ) {
        return prisma.$transaction(async (tx) => {
            // Get accounts
            const cashAccount = await tx.ledgerAccount.findFirst({
                where: { brandId: ctx.brandId, code: '1-1001' }
            });

            let expenseAccountCode = '5-9000'; // Default: Biaya Lain-lain
            if (input.category === 'COGS') {
                expenseAccountCode = '5-1000';
            } else if (input.category === 'MARKETING') {
                expenseAccountCode = '5-5000';
            }

            const expenseAccount = await tx.ledgerAccount.findFirst({
                where: { brandId: ctx.brandId, code: expenseAccountCode }
            });

            if (!cashAccount || !expenseAccount) {
                throw new Error('Ledger accounts not configured');
            }

            // Create transaction
            const transaction = await tx.journalTransaction.create({
                data: {
                    brandId: ctx.brandId,
                    referenceId: input.referenceId,
                    description: input.description,
                    date: new Date()
                }
            });

            // Debit: Expense (increase expense)
            await tx.journalEntry.create({
                data: {
                    brandId: ctx.brandId,
                    transactionId: transaction.id,
                    accountId: expenseAccount.id,
                    debit: input.amount,
                    credit: 0
                }
            });

            // Credit: Cash (decrease asset)
            await tx.journalEntry.create({
                data: {
                    brandId: ctx.brandId,
                    transactionId: transaction.id,
                    accountId: cashAccount.id,
                    debit: 0,
                    credit: input.amount
                }
            });

            return transaction;
        });
    }

    /**
     * Generate P&L report
     */
    async generatePL(
        brandId: string,
        startDate: Date,
        endDate: Date
    ) {
        // Revenue
        const revenueEntries = await prisma.journalEntry.findMany({
            where: {
                account: {
                    brandId,
                    type: 'REVENUE'
                },
                transaction: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        });

        const revenue = revenueEntries.reduce(
            (sum, entry) => sum + Number(entry.credit),
            0
        );

        // COGS
        const cogsEntries = await prisma.journalEntry.findMany({
            where: {
                account: {
                    brandId,
                    code: { startsWith: '6' } // 6000-COGS
                },
                transaction: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        });

        const cogs = cogsEntries.reduce(
            (sum, entry) => sum + Number(entry.debit),
            0
        );

        // Operating Expenses
        const opexEntriesLegacy = await prisma.journalEntry.findMany({
            where: {
                account: {
                    brandId,
                    code: { startsWith: '7' } // legacy mapping
                },
                transaction: {
                    date: { gte: startDate, lte: endDate }
                }
            }
        });

        const opexEntriesModern = await prisma.journalEntry.findMany({
            where: {
                account: {
                    brandId,
                    code: { startsWith: '5-', not: '5-1' } // modern non-COGS
                },
                transaction: {
                    date: { gte: startDate, lte: endDate }
                }
            }
        });

        const opex = [...opexEntriesLegacy, ...opexEntriesModern].reduce(
            (sum, entry) => sum + Number(entry.debit),
            0
        );

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - opex;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            revenue,
            cogs,
            grossProfit,
            grossMargin,
            opex,
            netProfit,
            netMargin,
            period: {
                start: startDate,
                end: endDate
            }
        };
    }

    /**
     * Get ledger balance
     */
    async getLedgerBalance(brandId: string) {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId },
            include: {
                entries: true
            }
        });

        return accounts.map(account => {
            const totalDebit = account.entries.reduce(
                (sum, entry) => sum + Number(entry.debit),
                0
            );
            const totalCredit = account.entries.reduce(
                (sum, entry) => sum + Number(entry.credit),
                0
            );

            let balance = 0;
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                balance = totalDebit - totalCredit;
            } else {
                balance = totalCredit - totalDebit;
            }

            return {
                code: account.code,
                name: account.name,
                type: account.type,
                balance
            };
        });
    }

    /**
     * Verify ledger integrity (debits = credits)
     */
    async verifyLedgerIntegrity(brandId: string) {
        const transactions = await prisma.journalTransaction.findMany({
            where: { brandId },
            include: {
                entries: true
            }
        });

        const errors: Array<{ transactionId: string; debit: number; credit: number }> = [];

        for (const transaction of transactions) {
            const totalDebit = transaction.entries.reduce(
                (sum, entry) => sum + Number(entry.debit),
                0
            );
            const totalCredit = transaction.entries.reduce(
                (sum, entry) => sum + Number(entry.credit),
                0
            );

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                errors.push({
                    transactionId: transaction.id,
                    debit: totalDebit,
                    credit: totalCredit
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Setup default ledger accounts for brand
     */
    async setupLedgerAccounts(brandId: string) {
        const defaultAccounts = [
            { code: '1-1001', name: 'Kas Besar', type: 'ASSET' },
            { code: '1-1300', name: 'Persediaan Bahan Baku', type: 'ASSET' },
            { code: '2-1000', name: 'Hutang Usaha', type: 'LIABILITY' },
            { code: '3-1000', name: 'Modal Disetor', type: 'EQUITY' },
            { code: '4-1000', name: 'Pendapatan Makanan', type: 'REVENUE' },
            { code: '5-1000', name: 'Harga Pokok Penjualan (COGS)', type: 'EXPENSE' },
            { code: '5-9000', name: 'Biaya Lain-lain', type: 'EXPENSE' },
            { code: '5-5000', name: 'Biaya Marketing & Iklan', type: 'EXPENSE' },
            { code: '5-7200', name: 'Biaya Loyalty & Reward', type: 'EXPENSE' }
        ];

        for (const account of defaultAccounts) {
            await prisma.ledgerAccount.upsert({
                where: {
                    brandId_code: {
                        brandId,
                        code: account.code
                    }
                },
                create: {
                    brandId,
                    ...account
                },
                update: {}
            });
        }

        return defaultAccounts;
    }

    /**
     * Get financial summary for dashboard
     */
    async getFinancialSummary(brandId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonth = await this.generatePL(brandId, startOfMonth, now);
        const lastMonth = await this.generatePL(brandId, startOfLastMonth, endOfLastMonth);

        const revenueGrowth = lastMonth.revenue > 0
            ? ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100
            : 0;

        return {
            thisMonth,
            lastMonth,
            revenueGrowth
        };
    }
}
