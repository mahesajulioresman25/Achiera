'use server';

import { InterCompanyService, ICTransactionInput } from '@/lib/services/InterCompanyService';
import { revalidatePath } from 'next/cache';

const icService = new InterCompanyService();

export async function createICTransactionAction(data: ICTransactionInput) {
    try {
        const result = await icService.createICTransaction(data);
        if (result.success) {
            revalidatePath('/dashboard/owner');
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveICTransactionAction(transactionId: string, approvedBy: string) {
    try {
        const result = await icService.approveICTransaction(transactionId, approvedBy);
        if (result.success) {
            revalidatePath('/dashboard/owner');
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectICTransactionAction(transactionId: string) {
    try {
        const result = await icService.rejectICTransaction(transactionId);
        if (result.success) {
            revalidatePath('/dashboard/owner');
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getICBalancesAction() {
    try {
        const balances = await icService.getICBalances();
        return { success: true, data: balances };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPendingICTransactionsAction() {
    try {
        const { prisma } = await import('@/lib/prisma');
        const transactions = await prisma.interCompanyTransaction.findMany({
            where: { status: 'PENDING' },
            include: {
                fromBrand: true,
                toBrand: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Serialize Decimal to Number for client components
        const serializedTransactions = transactions.map(tx => ({
            ...tx,
            amount: Number(tx.amount)
        }));

        return { success: true, data: serializedTransactions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getICTransactionHistoryAction(brandId?: string) {
    try {
        const { prisma } = await import('@/lib/prisma');

        const where = brandId
            ? {
                OR: [
                    { fromBrandId: brandId },
                    { toBrandId: brandId }
                ]
            }
            : {};

        const transactions = await prisma.interCompanyTransaction.findMany({
            where,
            include: {
                fromBrand: true,
                toBrand: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Serialize Decimal to Number for client components
        const serializedTransactions = transactions.map(tx => ({
            ...tx,
            amount: Number(tx.amount)
        }));

        return { success: true, data: serializedTransactions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
