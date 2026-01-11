import { prisma } from '@/lib/prisma';
import { JournalService } from './journalService';
import { AssetCategory } from '@prisma/client';

/**
 * Asset Engine for handling Fixed Assets and Depreciation
 */
export class AssetEngine {
    /**
     * Calculate monthly depreciation using Straight-Line method
     * Depreciation = (Purchase Price - Salvage Value) / Useful Life
     */
    static calculateStraightLineDepreciation(
        purchasePrice: number,
        salvageValue: number,
        usefulLifeMonths: number
    ) {
        if (usefulLifeMonths <= 0) return 0;
        return (purchasePrice - salvageValue) / usefulLifeMonths;
    }

    /**
     * Process monthly depreciation for all active assets for a brand
     */
    static async processMonthlyDepreciation(brandId: string) {
        const assets = await prisma.businessAsset.findMany({
            where: {
                brandId,
                status: 'ACTIVE',
            }
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const asset of assets) {
            // Check if already depreciated this month
            const alreadyDepreciated = await prisma.assetDepreciation.findFirst({
                where: {
                    assetId: asset.id,
                    asset: { brandId }, // Added for Brand Isolation
                    date: {
                        gte: startOfMonth
                    }
                }
            });

            if (alreadyDepreciated) continue;

            const amount = this.calculateStraightLineDepreciation(
                Number(asset.purchasePrice),
                Number(asset.salvageValue),
                asset.usefulLifeMonths
            );

            if (amount <= 0) continue;

            // Financial Accounts Integration
            const expenseAccount = '5-1100'; // Beban Penyusutan (Depreciation Expense)
            const accumAccount = `1-${asset.category}-ACCUM`; // Akumulasi Penyusutan

            // Ensure accounts exist
            await this.ensureLedgerAccount(brandId, expenseAccount, 'Beban Penyusutan Aset', 'EXPENSE');
            await this.ensureLedgerAccount(brandId, accumAccount, `Akumulasi Penyusutan ${asset.category}`, 'ASSET');

            // Record in Journal
            const transaction = await JournalService.createTransaction(
                brandId,
                now,
                `[AUTO-DEPRECIATION] Penyusutan Bulanan: ${asset.name} (${asset.code})`,
                [
                    { accountCode: expenseAccount, debit: amount, credit: 0 },
                    { accountCode: accumAccount, debit: 0, credit: amount }
                ],
                'DEPRECIATION',
                asset.id
            );

            // Record depreciation entry
            await prisma.assetDepreciation.create({
                data: {
                    brandId,
                    assetId: asset.id,
                    date: now,
                    amount,
                    journalTransactionId: transaction.id
                }
            } as any);
        }
    }

    /**
     * Helper to ensure ledger accounts exist for asset transactions
     */
    public static async ensureLedgerAccount(brandId: string, code: string, name: string, type: 'ASSET' | 'EXPENSE') {
        const existing = await prisma.ledgerAccount.findUnique({
            where: { brandId_code: { brandId, code } }
        });

        if (!existing) {
            await prisma.ledgerAccount.create({
                data: { brandId, code, name, type, balance: 0 }
            });
        }
    }

    /**
     * Get financial snapshot of all assets
     */
    static async getAssetOverview(brandId: string) {
        const assets = await prisma.businessAsset.findMany({
            where: { brandId },
            include: { depreciations: true }
        });

        let totalPurchasePrice = 0;
        let totalCurrentDepreciation = 0;

        const assetDetails = assets.map(asset => {
            const accumulated = asset.depreciations.reduce((sum, d) => sum + Number(d.amount), 0);
            const purchasePrice = Number(asset.purchasePrice);
            const bookValue = purchasePrice - accumulated;

            totalPurchasePrice += purchasePrice;
            totalCurrentDepreciation += accumulated;

            return {
                ...asset,
                accumulatedDepreciation: accumulated,
                bookValue: bookValue,
                remainingMonths: Math.max(0, asset.usefulLifeMonths - asset.depreciations.length)
            };
        });

        return {
            totalPurchasePrice,
            totalAccumulatedDepreciation: totalCurrentDepreciation,
            totalBookValue: totalPurchasePrice - totalCurrentDepreciation,
            assets: assetDetails
        };
    }
}
