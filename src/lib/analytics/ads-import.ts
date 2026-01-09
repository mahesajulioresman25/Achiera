// ACHIERA Platform - Ads Excel Import Engine
// Platform-aware validation and import for ads data

import { prisma } from '@/lib/prisma';
import { trackAdsDailyMetrics } from './event-writer';
import { v4 as uuidv4 } from 'uuid';

type AdsPlatform = 'meta' | 'google' | 'shopee' | 'tiktok';

interface AdsImportRow {
    rowNumber: number;
    platform: string;
    campaignId?: string;
    campaignName: string;
    adSetId?: string;
    adSetName?: string;
    adId?: string;
    adName?: string;
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions?: number;
    revenue?: number;
    videoViews?: number;
    engagement?: number;
    reach?: number;
    frequency?: number;
}

interface ValidationResult {
    status: 'valid' | 'invalid';
    errors: string[];
}

interface ImportSummary {
    importId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; errors: string[] }>;
}

const VALID_PLATFORMS: AdsPlatform[] = ['meta', 'google', 'shopee', 'tiktok'];

/**
 * Validate ads row
 */
function validateAdsRow(row: AdsImportRow): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!row.platform) {
        errors.push('Platform is required');
    } else if (!VALID_PLATFORMS.includes(row.platform.toLowerCase() as AdsPlatform)) {
        errors.push(`Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
    }

    if (!row.campaignName || row.campaignName.trim() === '') {
        errors.push('Campaign name is required');
    }

    if (!row.date) {
        errors.push('Date is required');
    } else {
        // Validate date format
        const dateFormats = [
            /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        ];
        const isValidFormat = dateFormats.some(format => format.test(row.date));
        if (!isValidFormat) {
            errors.push('Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY');
        }
    }

    // Numeric validations
    if (row.impressions === undefined || row.impressions === null) {
        errors.push('Impressions is required');
    } else if (row.impressions < 0) {
        errors.push('Impressions cannot be negative');
    }

    if (row.clicks === undefined || row.clicks === null) {
        errors.push('Clicks is required');
    } else if (row.clicks < 0) {
        errors.push('Clicks cannot be negative');
    }

    if (row.spend === undefined || row.spend === null) {
        errors.push('Spend is required');
    } else if (row.spend < 0) {
        errors.push('Spend cannot be negative');
    }

    // Logical validations
    if (row.clicks > row.impressions) {
        errors.push('Clicks cannot exceed impressions');
    }

    if (row.conversions && row.conversions > row.clicks) {
        errors.push('Conversions cannot exceed clicks');
    }

    const status = errors.length > 0 ? 'invalid' : 'valid';
    return { status, errors };
}

/**
 * Normalize date to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): Date | null {
    try {
        // Try YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(dateStr);
        }

        // Try DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            return new Date(`${year}-${month}-${day}`);
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Import ads data from Excel
 */
export async function importAdsData(
    brandId: string,
    userId: string,
    rows: AdsImportRow[]
): Promise<ImportSummary> {
    const importId = uuidv4();
    const summary: ImportSummary = {
        importId,
        totalRows: rows.length,
        validRows: 0,
        invalidRows: 0,
        errors: []
    };

    // Process each row
    for (const row of rows) {
        const validation = validateAdsRow(row);

        // Store raw row
        await prisma.adsImportRaw.create({
            data: {
                importId,
                brandId,
                rowNumber: row.rowNumber,
                platform: row.platform.toLowerCase(),
                campaignId: row.campaignId,
                campaignName: row.campaignName,
                adSetId: row.adSetId,
                adSetName: row.adSetName,
                adId: row.adId,
                adName: row.adName,
                date: row.date,
                impressions: row.impressions,
                clicks: row.clicks,
                spend: row.spend,
                conversions: row.conversions,
                revenue: row.revenue,
                videoViews: row.videoViews,
                engagement: row.engagement,
                reach: row.reach,
                frequency: row.frequency,
                importedBy: userId,
                validationStatus: validation.status,
                validationErrors: validation.errors.length > 0 ? validation.errors : null
            }
        });

        // Track summary
        if (validation.status === 'invalid') {
            summary.invalidRows++;
            summary.errors.push({ row: row.rowNumber, errors: validation.errors });
        } else {
            summary.validRows++;

            // Create analytics event
            const normalizedDate = normalizeDate(row.date);
            if (normalizedDate) {
                await trackAdsDailyMetrics(
                    brandId,
                    {
                        platform: row.platform.toLowerCase(),
                        campaignId: row.campaignId,
                        campaignName: row.campaignName,
                        date: normalizedDate,
                        impressions: row.impressions,
                        clicks: row.clicks,
                        spend: row.spend,
                        conversions: row.conversions,
                        revenue: row.revenue
                    },
                    importId
                );
            }
        }
    }

    return summary;
}
