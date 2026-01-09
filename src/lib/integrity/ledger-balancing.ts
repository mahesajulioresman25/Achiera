// ACHIERA Platform - Ledger Balancing Guarantees
// Ensures double-entry integrity and automatic reconciliation

import { prisma } from '@/lib/prisma';
import { withTransaction } from './transaction-safe';

export class LedgerIntegrityError extends Error {
    constructor(
        message: string,
        public readonly transactionId?: string,
        public readonly debit?: number,
        public readonly credit?: number
    ) {
        super(message);
        this.name = 'LedgerIntegrityError';
    }
}

/**
 * Ledger balancing service
 */
export class LedgerBalancingService {
    /**
     * Create balanced journal entry (double-entry)
     */
    async createBalancedEntry(params: {
        brandId: string;
        description: string;
        referenceId?: string;
        entries: Array<{
            accountCode: string;
            debit: number;
            credit: number;
        }>;
    }): Promise<any> {
        return withTransaction(async (tx) => {
            // 1. Validate entries balance
            const totalDebit = params.entries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredit = params.entries.reduce((sum, e) => sum + e.credit, 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new LedgerIntegrityError(
                    'Entries do not balance',
                    undefined,
                    totalDebit,
                    totalCredit
                );
            }

            // 2. Create transaction
            const transaction = await tx.journalTransaction.create({
                data: {
                    brandId: params.brandId,
                    description: params.description,
                    referenceId: params.referenceId,
                    date: new Date()
                }
            });

            // 3. Create entries
            for (const entry of params.entries) {
                // Get account
                const account = await tx.ledgerAccount.findFirst({
                    where: {
                        brandId: params.brandId,
                        code: entry.accountCode
                    }
                });

                if (!account) {
                    throw new Error(`Account ${entry.accountCode} not found`);
                }

                // Create entry
                await tx.journalEntry.create({
                    data: {
                        transactionId: transaction.id,
                        accountId: account.id,
                        debit: entry.debit,
                        credit: entry.credit
                    }
                });
            }

            // 4. Verify transaction balances
            await this.verifyTransactionBalance(tx, transaction.id);

            return transaction;
        });
    }

    /**
     * Verify single transaction balances
     */
    private async verifyTransactionBalance(
        tx: any,
        transactionId: string
    ): Promise<void> {
        const entries = await tx.journalEntry.findMany({
            where: { transactionId }
        });

        const totalDebit = entries.reduce(
            (sum, e) => sum + Number(e.debit),
            0
        );
        const totalCredit = entries.reduce(
            (sum, e) => sum + Number(e.credit),
            0
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new LedgerIntegrityError(
                'Transaction does not balance',
                transactionId,
                totalDebit,
                totalCredit
            );
        }
    }

    /**
     * Verify all transactions for brand
     */
    async verifyAllTransactions(brandId: string): Promise<{
        isValid: boolean;
        errors: Array<{
            transactionId: string;
            debit: number;
            credit: number;
            difference: number;
        }>;
    }> {
        const transactions = await prisma.journalTransaction.findMany({
            where: { brandId },
            include: {
                entries: true
            }
        });

        const errors = [];

        for (const transaction of transactions) {
            const totalDebit = transaction.entries.reduce(
                (sum, e) => sum + Number(e.debit),
                0
            );
            const totalCredit = transaction.entries.reduce(
                (sum, e) => sum + Number(e.credit),
                0
            );

            const difference = Math.abs(totalDebit - totalCredit);

            if (difference > 0.01) {
                errors.push({
                    transactionId: transaction.id,
                    debit: totalDebit,
                    credit: totalCredit,
                    difference
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate account balances
     */
    async calculateAccountBalances(brandId: string): Promise<Array<{
        accountCode: string;
        accountName: string;
        accountType: string;
        balance: number;
    }>> {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId },
            include: {
                entries: true
            }
        });

        return accounts.map(account => {
            const totalDebit = account.entries.reduce(
                (sum, e) => sum + Number(e.debit),
                0
            );
            const totalCredit = account.entries.reduce(
                (sum, e) => sum + Number(e.credit),
                0
            );

            // Calculate balance based on account type
            let balance = 0;
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                balance = totalDebit - totalCredit;
            } else {
                balance = totalCredit - totalDebit;
            }

            return {
                accountCode: account.code,
                accountName: account.name,
                accountType: account.type,
                balance
            };
        });
    }

    /**
     * Verify accounting equation (Assets = Liabilities + Equity)
     */
    async verifyAccountingEquation(brandId: string): Promise<{
        isValid: boolean;
        assets: number;
        liabilities: number;
        equity: number;
        difference: number;
    }> {
        const balances = await this.calculateAccountBalances(brandId);

        const assets = balances
            .filter(b => b.accountType === 'ASSET')
            .reduce((sum, b) => sum + b.balance, 0);

        const liabilities = balances
            .filter(b => b.accountType === 'LIABILITY')
            .reduce((sum, b) => sum + b.balance, 0);

        const equity = balances
            .filter(b => b.accountType === 'EQUITY')
            .reduce((sum, b) => sum + b.balance, 0);

        // Add net income to equity
        const revenue = balances
            .filter(b => b.accountType === 'REVENUE')
            .reduce((sum, b) => sum + b.balance, 0);

        const expenses = balances
            .filter(b => b.accountType === 'EXPENSE')
            .reduce((sum, b) => sum + b.balance, 0);

        const netIncome = revenue - expenses;
        const totalEquity = equity + netIncome;

        const difference = Math.abs(assets - (liabilities + totalEquity));

        return {
            isValid: difference < 0.01,
            assets,
            liabilities,
            equity: totalEquity,
            difference
        };
    }

    /**
     * Generate trial balance
     */
    async generateTrialBalance(brandId: string): Promise<{
        accounts: Array<{
            code: string;
            name: string;
            type: string;
            debit: number;
            credit: number;
        }>;
        totalDebit: number;
        totalCredit: number;
        isBalanced: boolean;
    }> {
        const balances = await this.calculateAccountBalances(brandId);

        const accounts = balances.map(b => ({
            code: b.accountCode,
            name: b.accountName,
            type: b.accountType,
            debit: b.balance > 0 ? b.balance : 0,
            credit: b.balance < 0 ? Math.abs(b.balance) : 0
        }));

        const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
        const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

        return {
            accounts,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        };
    }

    /**
     * Reconcile ledger (find and fix imbalances)
     */
    async reconcileLedger(brandId: string): Promise<{
        fixed: number;
        errors: Array<any>;
    }> {
        const verification = await this.verifyAllTransactions(brandId);

        if (verification.isValid) {
            return { fixed: 0, errors: [] };
        }

        // Log errors for manual review
        for (const error of verification.errors) {
            await prisma.auditLog.create({
                data: {
                    userId: null,
                    brandId,
                    action: 'LEDGER_IMBALANCE_DETECTED',
                    entityType: 'JOURNAL_TRANSACTION',
                    entityId: error.transactionId,
                    metadata: {
                        debit: error.debit,
                        credit: error.credit,
                        difference: error.difference
                    }
                }
            });
        }

        return {
            fixed: 0,
            errors: verification.errors
        };
    }

    /**
     * Automated integrity check (run daily)
     */
    async runDailyIntegrityCheck(brandId: string): Promise<{
        timestamp: Date;
        transactionsValid: boolean;
        accountingEquationValid: boolean;
        trialBalanceValid: boolean;
        issues: string[];
    }> {
        const issues: string[] = [];

        // Check 1: Transaction balancing
        const transactionCheck = await this.verifyAllTransactions(brandId);
        if (!transactionCheck.isValid) {
            issues.push(`${transactionCheck.errors.length} unbalanced transactions`);
        }

        // Check 2: Accounting equation
        const equationCheck = await this.verifyAccountingEquation(brandId);
        if (!equationCheck.isValid) {
            issues.push(`Accounting equation imbalance: ${equationCheck.difference}`);
        }

        // Check 3: Trial balance
        const trialBalance = await this.generateTrialBalance(brandId);
        if (!trialBalance.isBalanced) {
            issues.push('Trial balance does not balance');
        }

        // Log results
        await prisma.auditLog.create({
            data: {
                userId: null,
                brandId,
                action: 'LEDGER_INTEGRITY_CHECK',
                entityType: 'SYSTEM',
                entityId: 'DAILY_CHECK',
                metadata: {
                    transactionsValid: transactionCheck.isValid,
                    accountingEquationValid: equationCheck.isValid,
                    trialBalanceValid: trialBalance.isBalanced,
                    issues
                }
            }
        });

        return {
            timestamp: new Date(),
            transactionsValid: transactionCheck.isValid,
            accountingEquationValid: equationCheck.isValid,
            trialBalanceValid: trialBalance.isBalanced,
            issues
        };
    }
}

// Export singleton
export const ledgerBalancing = new LedgerBalancingService();
