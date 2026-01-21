'use server';

import { auth } from '@/auth';
import { JournalService } from '@/lib/intelligence/journalService';
import { FinancialReports } from '@/lib/intelligence/financialReports';
import { ReconciliationService } from '@/lib/intelligence/reconciliationService';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getBrandConfigAction } from '../content/updateBrandConfig';
import { initializeChartOfAccounts } from '@/lib/intelligence/chartOfAccounts';

/**
 * Initialize Default Chart of Accounts
 */
export async function initializeChartOfAccountsAction(brandId: string) {
    try {
        await initializeChartOfAccounts(brandId);
        revalidatePath('/dashboard/rasa-ibu/finance');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Ledger Entries
 */
export async function getLedgerEntriesAction(brandId: string) {
    try {
        // Ensure serialization
        const entries = await JournalService.getLedgerEntries(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(entries)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Account Details (Drill-Down)
 */
export async function getAccountDetailsAction(brandId: string, accountCode: string, startDate: Date, endDate: Date) {
    try {
        const account = await prisma.ledgerAccount.findUnique({
            where: { brandId_code: { brandId, code: accountCode } }
        });

        if (!account) throw new Error('Account not found');

        const entries = await prisma.journalEntry.findMany({
            where: {
                accountId: account.id,
                transaction: {
                    brandId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            include: {
                transaction: true
            },
            orderBy: {
                transaction: { date: 'desc' }
            }
        });

        return { success: true, data: JSON.parse(JSON.stringify(entries)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Financial Reports
 */
export async function getFinancialReportsAction(brandId: string, type: 'PL' | 'BS' | 'CF' | 'EQ' | 'NOTES' | 'TAX', startDate: Date, endDate: Date) {
    try {
        const range = { start: startDate, end: endDate };

        let data: any;
        switch (type) {
            case 'PL':
                data = await FinancialReports.getProfitLoss(brandId, range);
                // Add Pulse data for performance insights
                try {
                    const { getFinancialPulse } = await import('@/lib/intelligence/financeEngine');
                    const pulse = await getFinancialPulse(brandId);
                    data = { ...data, pulse };
                } catch (e) {
                    console.warn('Could not fetch pulse for report insights:', e);
                }
                break;
            case 'BS':
                data = await FinancialReports.getBalanceSheet(brandId, endDate);
                break;
            case 'CF':
                data = await FinancialReports.getCashFlow(brandId, range);
                break;
            case 'EQ':
                data = await FinancialReports.getEquityStatement(brandId, range);
                break;
            case 'NOTES':
                data = await FinancialReports.getNotes(brandId, range);
                break;
            case 'TAX':
                data = await FinancialReports.getTaxReport(brandId, range);
                break;
        }

        return { success: true, data: JSON.parse(JSON.stringify(data)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Pending Reconciliations
 */
export async function getPendingReconciliationsAction(brandId: string) {
    try {
        const bankData = await ReconciliationService.getPendingReconciliations(brandId);

        // Fetch from Payment table too (Proofs uploaded from tracking page)
        const paymentData = await prisma.payment.findMany({
            where: {
                order: { brandId },
                isVerified: false,
                proofPath: { not: null }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        customerName: true,
                        totalAmount: true,
                        createdAt: true
                    }
                }
            }
        });

        const normalizedPayments = [
            ...bankData.map(b => ({ ...b, sourceType: 'BANK_RECON' })),
            ...paymentData.map(p => ({
                id: p.id,
                paymentProof: p.proofPath,
                amount: p.amount,
                bankAccount: p.destinationBankId || 'QRIS/E-Wallet',
                paymentMethod: p.type,
                createdAt: p.createdAt,
                order: p.order,
                sourceType: 'PAYMENT_PROOF'
            }))
        ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: JSON.parse(JSON.stringify(normalizedPayments)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Verify Payment
 */
export async function verifyPaymentAction(reconciliationId: string, verifiedBy: string) {
    try {
        // Check if it's from Payment table first
        const payment = await prisma.payment.findUnique({
            where: { id: reconciliationId }
        });

        if (payment) {
            const { verifyPaymentAction: qrisVerify } = await import('./qris');
            return await qrisVerify(reconciliationId, verifiedBy);
        }

        await ReconciliationService.verifyPayment(reconciliationId, verifiedBy);
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Reject Payment
 */
export async function rejectPaymentAction(reconciliationId: string, reason: string, rejectedBy: string) {
    try {
        // Check if it's from Payment table first
        const payment = await prisma.payment.findUnique({
            where: { id: reconciliationId }
        });

        if (payment) {
            const { rejectPaymentAction: qrisReject } = await import('./qris');
            return await qrisReject(reconciliationId, reason);
        }

        await ReconciliationService.rejectPayment(reconciliationId, reason, rejectedBy);
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Record a manual operational expense
 */
export async function recordExpenseAction(data: {
    brandId: string;
    expenseAccountCode: string; // Updated from 'category'
    amount: number;
    description: string;
    date: Date;
    sourceAccountId: string;
}) {
    try {
        await JournalService.recordExpense(
            data.brandId,
            data.amount,
            data.expenseAccountCode,
            data.description,
            data.date,
            data.sourceAccountId
        );
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        console.error('Record Expense Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Record manual income (non-order revenue)
 */
export async function recordIncomeAction(data: {
    brandId: string;
    amount: number;
    revenueAccountCode: string;
    description: string;
    assetAccountCode: string;
    date: Date;
}) {
    try {
        await JournalService.recordIncome(
            data.brandId,
            data.amount,
            data.revenueAccountCode,
            data.description,
            data.assetAccountCode,
            data.date
        );
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        console.error('Record Income Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get dynamic platform settings (fees, tax, etc.)
 */
export async function getPlatformSettingsAction(brandId: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const brandConfig = await prisma.brandConfig.findUnique({
            where: { brandId },
            select: { targetMonthlyVolume: true }
        });

        // Default settings if none exist
        const defaultSettings = {
            marketplaceFees: {
                WHATSAPP: 0,
                SHOPEE: 15,
                GRAB_FOOD: 25,
                GO_FOOD: 25,
                TIKTOK_SHOP: 12
            },
            campaignFees: {}, // Mapping hashtags to fee % (e.g. #PROMO: 5)
            taxRates: {
                PPN: 11,
                PPH: 0.5
            },
            mdrFees: {
                WHATSAPP: 0,
                SHOPEE: 1.5, // Common MDR for marketplaces
                GRAB_FOOD: 0,
                GO_FOOD: 0,
                TIKTOK_SHOP: 0
            },
            operationalOverhead: 5000, // Fixed cost per order
            dailyKitchenOverhead: 0,     // Fixed cost per day (Electric/Gas)
            loyalty: {
                pointsPerRupiah: 0.0001,
                tierThresholds: {
                    SILVER: 1000000,
                    GOLD: 5000000,
                    PLATINUM: 10000000
                },
                pointExpiryDays: 365
            }
        };

        // Merge defaults with saved settings to ensure all fields exist
        const savedSettings = (brand?.paymentSettings as any) || {};
        const settings = {
            ...defaultSettings,
            ...savedSettings,
            // Ensure nested objects are also merged if they exist in savedSettings but are partial
            marketplaceFees: { ...defaultSettings.marketplaceFees, ...(savedSettings.marketplaceFees || {}) },
            campaignFees: { ...defaultSettings.campaignFees, ...(savedSettings.campaignFees || {}) },
            taxRates: { ...defaultSettings.taxRates, ...(savedSettings.taxRates || {}) },
            mdrFees: { ...defaultSettings.mdrFees, ...(savedSettings.mdrFees || {}) },
            // Ensure QRIS fields exist
            qrisEnabled: savedSettings.qrisEnabled || false,
            qrisImageUrl: savedSettings.qrisImageUrl || '',
            // Ensure Loyalty fields exist
            loyalty: {
                ...defaultSettings.loyalty,
                ...(savedSettings.loyalty || {}),
                tierThresholds: {
                    ...defaultSettings.loyalty.tierThresholds,
                    ...(savedSettings.loyalty?.tierThresholds || {})
                }
            }
        };
        settings.targetMonthlyVolume = brandConfig?.targetMonthlyVolume || 100;

        return {
            success: true,
            settings
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update dynamic platform settings
 */
export async function updatePlatformSettingsAction(brandId: string, settings: any) {
    try {
        // Extract targetMonthlyVolume from settings to update BrandConfig
        const { targetMonthlyVolume, ...paymentSettings } = settings;

        // Update Payment Settings
        await prisma.brand.update({
            where: { id: brandId },
            data: {
                paymentSettings
            }
        });

        // Update Target Monthly Volume in BrandConfig
        if (targetMonthlyVolume !== undefined) {
            await prisma.brandConfig.upsert({
                where: { brandId },
                update: { targetMonthlyVolume: Number(targetMonthlyVolume) },
                create: {
                    brandId,
                    targetMonthlyVolume: Number(targetMonthlyVolume)
                }
            });
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Tax Report for current month
 */
export async function getTaxReportAction(brandId: string) {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const report = await FinancialReports.getTaxReport(brandId, { start, end });
        return { success: true, report };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Get all ledger accounts for a brand
 */
export async function getLedgerAccountsAction(brandId: string) {
    try {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId },
            orderBy: { code: 'asc' }
        });

        // Calculate dynamic balances
        const balances = await prisma.journalEntry.groupBy({
            by: ['accountId'],
            where: {
                transaction: {
                    brandId: brandId
                }
            },
            _sum: {
                debit: true,
                credit: true
            }
        });

        const accountsWithBalance = accounts.map(acc => {
            const bal = balances.find(b => b.accountId === acc.id);
            const debit = Number(bal?._sum.debit || 0);
            const credit = Number(bal?._sum.credit || 0);

            let finalBalance = 0;
            if (['ASSET', 'EXPENSE'].includes(acc.type)) {
                finalBalance = debit - credit;
            } else {
                finalBalance = credit - debit;
            }

            return { ...acc, balance: finalBalance };
        });

        return { success: true, data: JSON.parse(JSON.stringify(accountsWithBalance)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create a new ledger account
 */
export async function createLedgerAccountAction(data: {
    brandId: string;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}) {
    try {
        const account = await prisma.ledgerAccount.create({
            data: {
                brandId: data.brandId,
                code: data.code,
                name: data.name,
                type: data.type,
                balance: 0
            }
        });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(account)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Automatically record daily kitchen overhead if not yet recorded today
 */
export async function syncDailyOverheadAction(brandId: string) {
    try {
        const configRes = await getBrandConfigAction(brandId);
        if (!configRes.success || !configRes.data) {
            return { success: false, error: 'Config not found' };
        }

        const breakdown = (configRes.data as any).overheadBreakdown || {};
        const dailyLabor = Math.round((Number(breakdown.labor) || 0) / 30);
        const dailyUtilities = Math.round(((Number(breakdown.electricity) || 0) + (Number(breakdown.water) || 0) + (Number(breakdown.gas) || 0)) / 30);

        if (dailyLabor + dailyUtilities <= 0) {
            return { success: true, message: 'Settings not configured or zero' };
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Check if already exists for today
        const existing = await prisma.journalTransaction.findFirst({
            where: {
                brandId,
                description: { contains: '[AUTO-DAILY-OVERHEAD]' },
                date: {
                    gte: new Date(todayStr),
                    lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (existing) {
            return { success: true, message: 'Sudah tercatat hari ini' };
        }

        // Ensure accounts exist
        await prisma.ledgerAccount.upsert({
            where: { brandId_code: { brandId, code: '5-UTILITIES' } },
            update: {},
            create: { brandId, code: '5-UTILITIES', name: 'Biaya Listrik, Air & Gas', type: 'EXPENSE' }
        });
        await prisma.ledgerAccount.upsert({
            where: { brandId_code: { brandId, code: '5-2000' } },
            update: {},
            create: { brandId, code: '5-2000', name: 'Biaya Gaji', type: 'EXPENSE' }
        });
        await prisma.ledgerAccount.upsert({
            where: { brandId_code: { brandId, code: '2-5000' } },
            update: {},
            create: { brandId, code: '2-5000', name: 'Hutang Biaya Operasional', type: 'LIABILITY' }
        });

        // Accounts already checked in upsert below

        // Record Salary Overhead
        if (dailyLabor > 0) {
            await JournalService.recordExpense(
                brandId,
                dailyLabor,
                '5-2000',
                `[AUTO-DAILY-OVERHEAD] Alokasi Gaji Harian (${todayStr})`,
                now,
                '2-5000'
            );
        }

        // Record Utilities Overhead
        if (dailyUtilities > 0) {
            await JournalService.recordExpense(
                brandId,
                dailyUtilities,
                '5-UTILITIES',
                `[AUTO-DAILY-OVERHEAD] Alokasi Biaya Dapur Harian (${todayStr})`,
                now,
                '2-5000'
            );
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, message: 'Berhasil mencatat biaya harian: Rp ' + (dailyLabor + dailyUtilities).toLocaleString('id-ID') };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Pricing Recommendation Integrated with Brand Overhead Config
 */
export async function getPricingRecommendationAction(brandId: string, costPrice: number) {
    try {
        const { getPricingRecommendation } = await import('@/lib/intelligence/financeEngine');
        const data = await getPricingRecommendation(brandId, costPrice);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Money Mutation (Transaction History) for Liquid Asset Accounts
 */
export async function getMoneyMutationAction(brandId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    accountCode?: string;
    limit?: number;
}) {
    try {
        const { startDate, endDate, accountCode, limit = 100 } = options || {};

        // 1. Identify Liquid Asset Accounts (Cash & Bank)
        // Usually starting with '1-1' (Current Assets - Cash/Bank)
        const accounts = await prisma.ledgerAccount.findMany({
            where: {
                brandId,
                type: 'ASSET',
                code: accountCode ? accountCode : { startsWith: '1-1' }
            },
            select: { id: true, code: true, name: true }
        });

        const accountIds = accounts.map(a => a.id);

        // 2. Fetch Journal Entries for these accounts
        const entries = await prisma.journalEntry.findMany({
            where: {
                accountId: { in: accountIds },
                transaction: {
                    brandId,
                    ...(startDate || endDate ? {
                        date: {
                            ...(startDate ? { gte: startDate } : {}),
                            ...(endDate ? { lte: endDate } : {})
                        }
                    } : {})
                }
            },
            include: {
                transaction: {
                    select: {
                        id: true,
                        date: true,
                        description: true,
                        referenceType: true,
                        referenceId: true,
                        createdBy: true
                    }
                },
                account: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            },
            orderBy: {
                transaction: { date: 'desc' }
            },
            take: limit
        });

        // 3. Transform for UI
        const formatted = entries.map(entry => {
            const amount = Number(entry.debit) - Number(entry.credit);
            return {
                id: entry.id,
                date: entry.transaction.date,
                description: entry.description || entry.transaction.description,
                accountName: entry.account.name,
                accountCode: entry.account.code,
                type: amount > 0 ? 'MASUK' : 'KELUAR',
                amount: Math.abs(amount),
                referenceType: entry.transaction.referenceType,
                referenceId: entry.transaction.referenceId,
                operator: entry.transaction.createdBy
            };
        });

        return { success: true, data: JSON.parse(JSON.stringify(formatted)) };
    } catch (error: any) {
        console.error('Get Money Mutation Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mengambil log sistem (untuk riwayat email parsing)
 */
export async function getAppLogsAction(brandId: string, type?: string, limit: number = 50) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const logs = await prisma.appLog.findMany({
            where: {
                brandId,
                ...(type ? { type } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return { success: true, logs: JSON.parse(JSON.stringify(logs)) };
    } catch (error: any) {
        console.error('Failed to fetch app logs:', error);
        return { success: false, error: error.message };
    }
}

