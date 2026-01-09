// ACHIERA Platform - Ledger Integrity Guard
// Debit = Credit enforcement with brand isolation

import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withTransaction } from './transaction';

export class LedgerImbalanceError extends Error {
    constructor(
        message: string,
        public readonly debit: number,
        public readonly credit: number
    ) {
        super(message);
        this.name = 'LedgerImbalanceError';
    }
}

type LedgerEntry = {
    accountCode: string;
    debit: number;
    credit: number;
};

/**
 * Post balanced ledger entry (double-entry enforced)
 * Brand-isolated ledger with automatic imbalance detection
 */
export async function postLedgerEntry(
    brandId: string,
    description: string,
    entries: LedgerEntry[],
    referenceId?: string,
    tx?: PrismaClient
): Promise<string> {
    const operation = async (client: PrismaClient) => {
        // Validate balance
        const totalDebit = entries.reduce((sum: number, e: LedgerEntry) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum: number, e: LedgerEntry) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new LedgerImbalanceError(
                'Ledger entries do not balance',
                totalDebit,
                totalCredit
            );
        }

        // Create transaction
        const transaction = await client.journalTransaction.create({
            data: {
                brandId,
                description,
                referenceId,
                date: new Date()
            }
        });

        // Create entries
        for (const entry of entries) {
            // Get account
            const account = await client.ledgerAccount.findFirst({
                where: {
                    brandId,
                    code: entry.accountCode
                }
            });

            if (!account) {
                throw new Error(`Account ${entry.accountCode} not found for brand ${brandId}`);
            }

            // Create entry
            await client.journalEntry.create({
                data: {
                    transactionId: transaction.id,
                    accountId: account.id,
                    debit: entry.debit,
                    credit: entry.credit
                }
            });
        }

        // Verify transaction balance (double-check)
        const createdEntries = await client.journalEntry.findMany({
            where: { transactionId: transaction.id }
        });

        const verifyDebit = createdEntries.reduce((sum: number, e: any) => sum + Number(e.debit), 0);
        const verifyCredit = createdEntries.reduce((sum: number, e: any) => sum + Number(e.credit), 0);

        if (Math.abs(verifyDebit - verifyCredit) > 0.01) {
            throw new LedgerImbalanceError(
                'Transaction verification failed',
                verifyDebit,
                verifyCredit
            );
        }

        return transaction.id;
    };

    if (tx) {
        return operation(tx);
    }
    return withTransaction(operation);
}

/**
 * Verify all transactions balance (integrity check)
 */
export async function verifyLedgerIntegrity(brandId: string): Promise<{
    isValid: boolean;
    errors: Array<{ transactionId: string; debit: number; credit: number }>;
}> {
    const transactions = await prisma.journalTransaction.findMany({
        where: { brandId },
        include: { entries: true }
    });

    const errors = [];

    for (const tx of transactions) {
        const debit = tx.entries.reduce((sum: number, e: any) => sum + Number(e.debit), 0);
        const credit = tx.entries.reduce((sum: number, e: any) => sum + Number(e.credit), 0);

        if (Math.abs(debit - credit) > 0.01) {
            errors.push({
                transactionId: tx.id,
                debit,
                credit
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Record revenue (helper)
 */
export async function recordRevenue(
    brandId: string,
    amount: number,
    orderId: string,
    tx?: PrismaClient
): Promise<string> {
    return postLedgerEntry(
        brandId,
        `Revenue from order ${orderId}`,
        [
            { accountCode: '1000-CASH', debit: amount, credit: 0 },
            { accountCode: '4000-REVENUE', debit: 0, credit: amount }
        ],
        orderId,
        tx
    );
}

/**
 * Record refund (helper)
 */
export async function recordRefund(
    brandId: string,
    amount: number,
    orderId: string,
    tx?: PrismaClient
): Promise<string> {
    return postLedgerEntry(
        brandId,
        `Refund for order ${orderId}`,
        [
            { accountCode: '4000-REVENUE', debit: amount, credit: 0 },
            { accountCode: '1000-CASH', debit: 0, credit: amount }
        ],
        orderId,
        tx
    );
}
