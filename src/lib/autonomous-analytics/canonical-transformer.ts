// ACHIERA Autonomous Analytics - Canonical Transformation
// Transforms raw rows to canonical schema with validation

import { prisma } from '@/lib/prisma';
import type { CanonicalField } from './header-inference';

interface CanonicalSalesData {
    transactionDate: Date;
    transactionTime?: Date;
    orderId?: string;
    sku?: string;
    productName: string;
    productCategory?: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discountAmount: number;
    netAmount: number;
    platform?: string;
    channel?: string;
    storeName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    promotionCode?: string;
    promotionName?: string;
    paymentMethod?: string;
    shippingCost?: number;
    notes?: string;
}

interface CanonicalAdsData {
    campaignId?: string;
    campaignName: string;
    adSetId?: string;
    adSetName?: string;
    adId?: string;
    adName?: string;
    platform: string;
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    revenue: number;
    reach?: number;
    frequency?: number;
    videoViews?: number;
    engagement?: number;
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): Date | null {
    if (!value) return null;

    const str = String(value).trim();

    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return new Date(str);
    }

    // Try DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [day, month, year] = str.split('/');
        return new Date(`${year}-${month}-${day}`);
    }

    // Try DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
        const [day, month, year] = str.split('-');
        return new Date(`${year}-${month}-${day}`);
    }

    // Try parsing as-is
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse number
 */
function parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = String(value).trim().replace(/[,]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

/**
 * Transform raw row to canonical sales schema
 */
export async function transformToCanonicalSales(
    rawRowId: string,
    brandId: string,
    rawData: Record<string, any>,
    mappings: Record<CanonicalField, string>
): Promise<CanonicalSalesData> {
    // Extract values using mappings
    const getValue = (field: CanonicalField): any => {
        const columnName = mappings[field];
        return columnName ? rawData[columnName] : null;
    };

    // Required fields
    const transactionDate = parseDate(getValue('transaction_date'));
    if (!transactionDate) {
        throw new Error('Missing required field: transaction_date');
    }

    const productName = String(getValue('product_name') || '').trim();
    if (!productName) {
        throw new Error('Missing required field: product_name');
    }

    const quantity = parseNumber(getValue('quantity'));
    if (quantity <= 0) {
        throw new Error('Invalid quantity: must be > 0');
    }

    const unitPrice = parseNumber(getValue('unit_price'));
    if (unitPrice < 0) {
        throw new Error('Invalid unit_price: cannot be negative');
    }

    const totalAmount = parseNumber(getValue('total_amount'));
    const discountAmount = parseNumber(getValue('discount_amount'));

    // Calculate net amount if not provided
    let netAmount = parseNumber(getValue('net_amount'));
    if (!netAmount) {
        netAmount = totalAmount - discountAmount;
    }

    return {
        transactionDate,
        transactionTime: parseDate(getValue('transaction_time')) || undefined,
        orderId: String(getValue('order_id') || '').trim() || undefined,
        sku: String(getValue('sku') || '').trim() || undefined,
        productName,
        productCategory: String(getValue('product_category') || '').trim() || undefined,
        variantName: String(getValue('variant_name') || '').trim() || undefined,
        quantity,
        unitPrice,
        totalAmount,
        discountAmount,
        netAmount,
        platform: String(getValue('platform') || '').trim() || undefined,
        channel: String(getValue('channel') || '').trim() || undefined,
        storeName: String(getValue('store_name') || '').trim() || undefined,
        customerId: String(getValue('customer_id') || '').trim() || undefined,
        customerName: String(getValue('customer_name') || '').trim() || undefined,
        customerPhone: String(getValue('customer_phone') || '').trim() || undefined,
        customerEmail: String(getValue('customer_email') || '').trim() || undefined,
        promotionCode: String(getValue('promotion_code') || '').trim() || undefined,
        promotionName: String(getValue('promotion_name') || '').trim() || undefined,
        paymentMethod: String(getValue('payment_method') || '').trim() || undefined,
        shippingCost: parseNumber(getValue('shipping_cost')) || undefined,
        notes: String(getValue('notes') || '').trim() || undefined
    };
}

/**
 * Transform raw row to canonical ads schema
 */
export async function transformToCanonicalAds(
    rawRowId: string,
    brandId: string,
    rawData: Record<string, any>,
    mappings: Record<CanonicalField, string>
): Promise<CanonicalAdsData> {
    const getValue = (field: CanonicalField): any => {
        const columnName = mappings[field];
        return columnName ? rawData[columnName] : null;
    };

    // Required fields
    const campaignName = String(getValue('campaign_name') || '').trim();
    if (!campaignName) {
        throw new Error('Missing required field: campaign_name');
    }

    const platform = String(getValue('platform') || '').trim().toLowerCase();
    if (!platform) {
        throw new Error('Missing required field: platform');
    }

    const date = parseDate(getValue('date'));
    if (!date) {
        throw new Error('Missing required field: date');
    }

    const impressions = parseNumber(getValue('impressions'));
    const clicks = parseNumber(getValue('clicks'));
    const spend = parseNumber(getValue('spend'));
    const conversions = parseNumber(getValue('conversions'));
    const revenue = parseNumber(getValue('revenue'));

    // Validation
    if (clicks > impressions) {
        throw new Error('Invalid data: clicks cannot exceed impressions');
    }

    if (conversions > clicks) {
        throw new Error('Invalid data: conversions cannot exceed clicks');
    }

    return {
        campaignId: String(getValue('campaign_id') || '').trim() || undefined,
        campaignName,
        adSetId: String(getValue('ad_set_id') || '').trim() || undefined,
        adSetName: String(getValue('ad_set_name') || '').trim() || undefined,
        adId: String(getValue('ad_id') || '').trim() || undefined,
        adName: String(getValue('ad_name') || '').trim() || undefined,
        platform,
        date,
        impressions,
        clicks,
        spend,
        conversions,
        revenue,
        reach: parseNumber(getValue('reach')) || undefined,
        frequency: parseNumber(getValue('frequency')) || undefined,
        videoViews: parseNumber(getValue('video_views')) || undefined,
        engagement: parseNumber(getValue('engagement')) || undefined
    };
}

/**
 * Process file and transform all rows to canonical
 */
export async function processFileToCanonical(fileId: string): Promise<void> {
    // Get file and mappings
    const file = await prisma.rawImportFile.findUnique({
        where: { id: fileId },
        include: {
            schemaMappings: true,
            rawRows: true
        }
    });

    if (!file) {
        throw new Error('File not found');
    }

    // Build mapping dictionary
    const mappings: Record<string, CanonicalField> = {};
    for (const mapping of file.schemaMappings) {
        if (mapping.canonicalField && mapping.canonicalField !== 'unknown') {
            mappings[mapping.canonicalField] = mapping.sourceColumnName;
        }
    }

    // Detect data type (sales vs ads)
    const hasSalesFields = 'product_name' in mappings && 'quantity' in mappings;
    const hasAdsFields = 'campaign_name' in mappings && 'impressions' in mappings;

    if (!hasSalesFields && !hasAdsFields) {
        throw new Error('Cannot determine data type: missing required fields');
    }

    const dataType = hasSalesFields ? 'sales' : 'ads';

    // Process each row
    let validCount = 0;
    let errorCount = 0;

    for (const rawRow of file.rawRows) {
        try {
            if (dataType === 'sales') {
                const canonicalData = await transformToCanonicalSales(
                    rawRow.id,
                    file.brandId,
                    rawRow.rawData as Record<string, any>,
                    mappings as Record<CanonicalField, string>
                );

                // Save to canonical table
                const canonical = await prisma.canonicalSalesTransaction.create({
                    data: {
                        brandId: file.brandId,
                        rawRowId: rawRow.id,
                        ...canonicalData
                    }
                });

                // Update raw row
                await prisma.rawRow.update({
                    where: { id: rawRow.id },
                    data: {
                        inferredType: 'sales',
                        validationStatus: 'valid',
                        processedAt: new Date(),
                        canonicalRecordId: canonical.id
                    }
                });

                validCount++;
            } else {
                const canonicalData = await transformToCanonicalAds(
                    rawRow.id,
                    file.brandId,
                    rawRow.rawData as Record<string, any>,
                    mappings as Record<CanonicalField, string>
                );

                // Calculate metrics
                const ctr = canonicalData.impressions > 0
                    ? canonicalData.clicks / canonicalData.impressions
                    : 0;
                const cpc = canonicalData.clicks > 0
                    ? canonicalData.spend / canonicalData.clicks
                    : 0;
                const cpa = canonicalData.conversions > 0
                    ? canonicalData.spend / canonicalData.conversions
                    : 0;
                const roas = canonicalData.spend > 0
                    ? canonicalData.revenue / canonicalData.spend
                    : 0;

                // Save to canonical table
                const canonical = await prisma.canonicalAdsMetric.create({
                    data: {
                        brandId: file.brandId,
                        rawRowId: rawRow.id,
                        ...canonicalData,
                        ctr,
                        cpc,
                        cpa,
                        roas
                    }
                });

                // Update raw row
                await prisma.rawRow.update({
                    where: { id: rawRow.id },
                    data: {
                        inferredType: 'ads',
                        validationStatus: 'valid',
                        processedAt: new Date(),
                        canonicalRecordId: canonical.id
                    }
                });

                validCount++;
            }
        } catch (error) {
            // Update raw row with error
            await prisma.rawRow.update({
                where: { id: rawRow.id },
                data: {
                    validationStatus: 'invalid',
                    validationErrors: [(error as Error).message]
                }
            });

            errorCount++;
        }
    }

    // Update file status
    await prisma.rawImportFile.update({
        where: { id: fileId },
        data: {
            processingStatus: errorCount === 0 ? 'completed' : 'completed',
            validRowCount: validCount,
            errorRowCount: errorCount,
            processingCompletedAt: new Date()
        }
    });
}
