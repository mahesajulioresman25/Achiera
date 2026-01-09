import { prisma } from '@/lib/prisma';

export type JournalEntryInput = {
    accountCode: string;
    description?: string;
    debit: number;
    credit: number;
};

/**
 * Journal Service for handling double-entry bookkeeping
 */
export class JournalService {

    /**
     * Create a general journal transaction with multiple entries
     * Validates that Debit = Credit
     */
    static async createTransaction(
        brandId: string,
        date: Date,
        description: string,
        entries: JournalEntryInput[],
        referenceType?: string,
        referenceId?: string,
        userId: string = 'SYSTEM'
    ) {
        // 1. Validate Balance
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) { // Allow small floating point diff
            throw new Error(`Transaction processing failed: Credits (${totalCredit}) do not equal Debits (${totalDebit})`);
        }

        return prisma.$transaction(async (tx) => {
            // 2. Create Transaction Header
            const transaction = await tx.journalTransaction.create({
                data: {
                    brandId,
                    date,
                    description,
                    referenceType,
                    referenceId,
                    createdBy: userId
                }
            });

            // 3. Process Entries and Update Account Balances
            for (const entry of entries) {
                const account = await tx.ledgerAccount.findUnique({
                    where: {
                        brandId_code: {
                            brandId,
                            code: entry.accountCode
                        }
                    }
                });

                if (!account) {
                    throw new Error(`Account code ${entry.accountCode} not found for brand ${brandId}`);
                }

                // Create Entry
                await tx.journalEntry.create({
                    data: {
                        transactionId: transaction.id,
                        accountId: account.id,
                        debit: entry.debit,
                        credit: entry.credit,
                        description: entry.description || description
                    }
                });

                // Update Account Balance
                // Asset/Expense: Debit increases, Credit decreases
                // Liability/Equity/Revenue: Credit increases, Debit decreases
                let balanceChange = 0;

                if (['ASSET', 'EXPENSE'].includes(account.type)) {
                    balanceChange = entry.debit - entry.credit;
                } else {
                    balanceChange = entry.credit - entry.debit;
                }

                await tx.ledgerAccount.update({
                    where: { id: account.id },
                    data: {
                        balance: {
                            increment: balanceChange
                        }
                    }
                });
            }

            return transaction;
        });
    }

    /**
     * Record a Sale (Revenue)
     * Dr. Cash/Receivable
     * Cr. Sales Revenue
     */
    static async recordSale(
        brandId: string,
        orderId: string,
        amount: number, // Net amount received
        channel: string = 'WEBSITE',
        hppAmount: number = 0,
        discountAmount: number = 0
    ) {
        // Resolve Debit Account based on channel
        let debitAccount = '1-1000'; // Default Cash

        if (['SHOPEE', 'TOKOPEDIA', 'GRABFOOD', 'GO_FOOD', 'TIKTOK_SHOP'].includes(channel)) {
            debitAccount = '1-1200'; // Piutang Usaha (Receivable)
        } else if (channel === 'WEBSITE') {
            debitAccount = '1-1100'; // Bank BCA (Default for Website Online)
        } else if (['WHATSAPP', 'OFFLINE', 'CASH'].includes(channel)) {
            debitAccount = '1-1000'; // Kas
        }

        const entries: JournalEntryInput[] = [
            { accountCode: debitAccount, debit: amount, credit: 0 },
            { accountCode: '4-1000', debit: 0, credit: amount + discountAmount } // Gross revenue
        ];

        // Add Discount entry if applicable
        if (discountAmount > 0) {
            entries.push({ accountCode: '4-3000', debit: discountAmount, credit: 0 }); // Sales Discount
        }

        // Add HPP entry if provided
        if (hppAmount > 0) {
            entries.push({ accountCode: '5-1000', debit: hppAmount, credit: 0 }); // HPP
            entries.push({ accountCode: '5-PANTRY', debit: 0, credit: hppAmount }); // Reduce Pantry Expense
        }

        return this.createTransaction(
            brandId,
            new Date(),
            `Penjualan Pesanan #${orderId.slice(-4)}`,
            entries,
            'ORDER',
            orderId
        );
    }

    /**
     * Record a Payment Received
     * Dr. Bank/Cash
     * Cr. Receivable
     */
    static async recordPayment(
        brandId: string,
        orderId: string,
        amount: number,
        paymentMethod: string = 'TRANSFER',
        destinationAccount: string = '1-1101', // Default Bank Mandiri
        deductions: { amount: number, accountCode: string, description?: string }[] = []
    ) {
        let debitAccount = destinationAccount;
        if (paymentMethod === 'CASH') {
            debitAccount = '1-1000';
        }

        const entries: JournalEntryInput[] = [
            { accountCode: debitAccount, debit: amount, credit: 0 }
        ];

        let totalDeduction = 0;
        for (const deduction of deductions) {
            if (deduction.amount > 0) {
                entries.push({
                    accountCode: deduction.accountCode,
                    debit: deduction.amount,
                    credit: 0,
                    description: deduction.description
                });
                totalDeduction += deduction.amount;
            }
        }

        // Credit Receivable with Total Amount (Net + Deductions)
        entries.push({
            accountCode: '1-1200',
            debit: 0,
            credit: amount + totalDeduction
        });

        return this.createTransaction(
            brandId,
            new Date(),
            `Penerimaan Pembayaran #${orderId.slice(-4)}`,
            entries,
            'PAYMENT',
            orderId
        );
    }

    /**
     * Record Manual Income (Non-Order)
     * Dr. Asset Account (Bank/Cash)
     * Cr. Revenue Account
     */
    static async recordIncome(
        brandId: string,
        amount: number,
        revenueAccountCode: string,
        description: string,
        assetAccountCode: string,
        date: Date = new Date()
    ) {
        return this.createTransaction(
            brandId,
            date,
            description,
            [
                { accountCode: assetAccountCode, debit: amount, credit: 0 },
                { accountCode: revenueAccountCode, debit: 0, credit: amount }
            ],
            'INCOME',
            undefined
        );
    }

    /**
     * Record an Operational Expense
     * Dr. Expense Account (5-xxxx)
     * Cr. Bank/Cash (1-xxxx)
     */
    static async recordExpense(
        brandId: string,
        amount: number,
        expenseAccountCode: string,
        description: string,
        date: Date = new Date(),
        sourceAccountId: string = '1-1000'
    ) {
        return this.createTransaction(
            brandId,
            date,
            description,
            [
                { accountCode: expenseAccountCode, debit: amount, credit: 0 },
                { accountCode: sourceAccountId, debit: 0, credit: amount }
            ],
            'EXPENSE',
            undefined
        );
    }

    /**
     * Get Ledger Entries for specific account or all
     */
    static async getLedgerEntries(brandId: string, accountCode?: string, limit: number = 100) {
        return prisma.journalEntry.findMany({
            where: {
                account: {
                    brandId,
                    ...(accountCode ? { code: accountCode } : {})
                }
            },
            include: {
                transaction: true,
                account: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }
}
