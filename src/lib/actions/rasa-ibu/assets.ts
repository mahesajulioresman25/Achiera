'use server';

import { prisma } from '@/lib/prisma';
import { AssetEngine } from '@/lib/intelligence/assetEngine';
import { revalidatePath } from 'next/cache';
import { AssetCategory } from '@prisma/client';

/**
 * Register a new business asset
 */
export async function createAssetAction(data: {
    brandId: string;
    name: string;
    code: string;
    category: AssetCategory;
    purchaseDate: Date;
    purchasePrice: number;
    usefulLifeMonths: number;
    salvageValue: number;
}) {
    try {
        const asset = await prisma.businessAsset.create({
            data: {
                brandId: data.brandId,
                name: data.name,
                code: data.code,
                category: data.category,
                purchaseDate: new Date(data.purchaseDate),
                purchasePrice: data.purchasePrice,
                usefulLifeMonths: data.usefulLifeMonths,
                salvageValue: data.salvageValue,
                status: 'ACTIVE'
            }
        });

        // Auto-create initial acquisition journal entry
        // Dr. Asset Account
        // Cr. Bank (1-1000 Kas Utama as default)
        const assetAccountCode = `1-${data.category}`;
        await AssetEngine.ensureLedgerAccount(data.brandId, assetAccountCode, `Aset: ${data.category}`, 'ASSET');

        const timestamp = new Date(data.purchaseDate);
        timestamp.setHours(12, 0, 0, 0); // Mid-day to avoid TZ issues

        try {
            const { JournalService } = await import('@/lib/intelligence/journalService');
            await JournalService.createTransaction(
                data.brandId,
                timestamp,
                `[ACQUISITION] Perolehan Aset: ${data.name} (${data.code})`,
                [
                    { accountCode: assetAccountCode, debit: data.purchasePrice, credit: 0 },
                    { accountCode: '1-1000', debit: 0, credit: data.purchasePrice }
                ],
                'ASSET_ACQUISITION',
                asset.id
            );
        } catch (journalErr) {
            console.warn('Initial journal entry failed (possible CoA missing), but asset was created:', journalErr);
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(asset)) };
    } catch (error: any) {
        console.error('Create Asset Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all assets for a brand with their financial health
 */
export async function getAssetsAction(brandId: string) {
    try {
        const overview = await AssetEngine.getAssetOverview(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(overview)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Run monthly depreciation process
 */
export async function runDepreciationAction(brandId: string) {
    try {
        await AssetEngine.processMonthlyDepreciation(brandId);
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Dispose an asset (Write-off)
 */
export async function disposeAssetAction(brandId: string, assetId: string, reason: string) {
    try {
        await prisma.businessAsset.update({
            where: { id: assetId, brandId },
            data: { status: 'DISPOSED' }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
