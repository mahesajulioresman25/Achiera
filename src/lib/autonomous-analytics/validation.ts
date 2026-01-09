// ACHIERA Autonomous Analytics - Data Quality & Validation Engine
// Validates data quality without blocking ingestion

import { prisma } from '@/lib/prisma';

export interface ValidationResult {
    isValid: boolean;
    severity: 'error' | 'warning' | 'info';
    rule: string;
    message: string;
    field?: string;
    value?: any;
    expectedRange?: { min: number; max: number };
}

export interface QualityScore {
    overallScore: number; // 0-100
    completeness: number;
    accuracy: number;
    consistency: number;
    anomalyCount: number;
    validationResults: ValidationResult[];
}

// ============================================
// RANGE VALIDATION
// ============================================

const RANGE_RULES = {
    quantity: { min: 0, max: 100000 },
    unitPrice: { min: 0, max: 1000000000 },
    totalAmount: { min: 0, max: 10000000000 },
    discountAmount: { min: 0, max: 1000000000 },
    impressions: { min: 0, max: 100000000000 },
    clicks: { min: 0, max: 10000000 },
    spend: { min: 0, max: 10000000000 },
    conversions: { min: 0, max: 1000000 },
    revenue: { min: 0, max: 100000000000 }
};

function validateRange(
    field: string,
    value: number,
    range: { min: number; max: number }
): ValidationResult | null {
    if (value < range.min || value > range.max) {
        return {
            isValid: false,
            severity: 'error',
            rule: 'range_validation',
            message: `${field} value ${value} is outside valid range [${range.min}, ${range.max}]`,
            field,
            value,
            expectedRange: range
        };
    }
    return null;
}

// ============================================
// OUTLIER DETECTION (Z-Score Method)
// ============================================

function calculateZScore(value: number, values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

function detectOutliers(
    field: string,
    value: number,
    allValues: number[],
    threshold: number = 3
): ValidationResult | null {
    if (allValues.length < 10) return null; // Need sufficient data

    const zScore = calculateZScore(value, allValues);

    if (Math.abs(zScore) > threshold) {
        return {
            isValid: true, // Don't block, just flag
            severity: 'warning',
            rule: 'outlier_detection',
            message: `${field} value ${value} is a statistical outlier (z-score: ${zScore.toFixed(2)})`,
            field,
            value
        };
    }

    return null;
}

// ============================================
// CONSISTENCY CHECKS
// ============================================

function validateSalesConsistency(data: {
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discountAmount: number;
    netAmount: number;
}): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check: totalAmount = quantity × unitPrice
    const expectedTotal = data.quantity * data.unitPrice;
    const totalDiff = Math.abs(data.totalAmount - expectedTotal);

    if (totalDiff > 0.01) { // Allow 1 cent rounding
        results.push({
            isValid: false,
            severity: 'warning',
            rule: 'consistency_check',
            message: `Total amount ${data.totalAmount} does not match quantity × unit price (${expectedTotal})`,
            field: 'totalAmount'
        });
    }

    // Check: netAmount = totalAmount - discountAmount
    const expectedNet = data.totalAmount - data.discountAmount;
    const netDiff = Math.abs(data.netAmount - expectedNet);

    if (netDiff > 0.01) {
        results.push({
            isValid: false,
            severity: 'warning',
            rule: 'consistency_check',
            message: `Net amount ${data.netAmount} does not match total - discount (${expectedNet})`,
            field: 'netAmount'
        });
    }

    // Check: discount <= totalAmount
    if (data.discountAmount > data.totalAmount) {
        results.push({
            isValid: false,
            severity: 'error',
            rule: 'consistency_check',
            message: `Discount amount ${data.discountAmount} exceeds total amount ${data.totalAmount}`,
            field: 'discountAmount'
        });
    }

    return results;
}

function validateAdsConsistency(data: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
}): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check: clicks <= impressions
    if (data.clicks > data.impressions) {
        results.push({
            isValid: false,
            severity: 'error',
            rule: 'consistency_check',
            message: `Clicks ${data.clicks} cannot exceed impressions ${data.impressions}`,
            field: 'clicks'
        });
    }

    // Check: conversions <= clicks
    if (data.conversions > data.clicks) {
        results.push({
            isValid: false,
            severity: 'error',
            rule: 'consistency_check',
            message: `Conversions ${data.conversions} cannot exceed clicks ${data.clicks}`,
            field: 'conversions'
        });
    }

    // Check: ROAS sanity (warn if > 20x)
    const roas = data.spend > 0 ? data.revenue / data.spend : 0;
    if (roas > 20) {
        results.push({
            isValid: true,
            severity: 'warning',
            rule: 'consistency_check',
            message: `Unusually high ROAS: ${roas.toFixed(2)}x (revenue: ${data.revenue}, spend: ${data.spend})`,
            field: 'revenue'
        });
    }

    return results;
}

// ============================================
// QUALITY SCORING
// ============================================

function calculateCompleteness(data: Record<string, any>, requiredFields: string[]): number {
    const presentFields = requiredFields.filter(field => {
        const value = data[field];
        return value !== null && value !== undefined && value !== '';
    });

    return (presentFields.length / requiredFields.length) * 100;
}

function calculateAccuracy(validationResults: ValidationResult[]): number {
    const errors = validationResults.filter(r => r.severity === 'error').length;
    const warnings = validationResults.filter(r => r.severity === 'warning').length;

    // Errors reduce score more than warnings
    const errorPenalty = errors * 10;
    const warningPenalty = warnings * 5;

    return Math.max(0, 100 - errorPenalty - warningPenalty);
}

function calculateConsistency(consistencyResults: ValidationResult[]): number {
    const inconsistencies = consistencyResults.filter(r => !r.isValid).length;
    return Math.max(0, 100 - (inconsistencies * 20));
}

export function calculateQualityScore(
    data: Record<string, any>,
    dataType: 'sales' | 'ads',
    validationResults: ValidationResult[]
): QualityScore {
    const requiredFields = dataType === 'sales'
        ? ['transactionDate', 'productName', 'quantity', 'unitPrice', 'totalAmount']
        : ['campaignName', 'platform', 'date', 'impressions', 'clicks', 'spend'];

    const completeness = calculateCompleteness(data, requiredFields);
    const accuracy = calculateAccuracy(validationResults);

    const consistencyResults = dataType === 'sales'
        ? validateSalesConsistency(data as any)
        : validateAdsConsistency(data as any);

    const consistency = calculateConsistency(consistencyResults);

    const anomalyCount = validationResults.filter(r =>
        r.rule === 'outlier_detection'
    ).length;

    // Overall score: weighted average
    const overallScore = (
        completeness * 0.3 +
        accuracy * 0.4 +
        consistency * 0.3
    );

    return {
        overallScore: Math.round(overallScore),
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        consistency: Math.round(consistency),
        anomalyCount,
        validationResults: [...validationResults, ...consistencyResults]
    };
}

// ============================================
// VALIDATE SALES DATA
// ============================================

export async function validateSalesData(
    brandId: string,
    data: {
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        discountAmount: number;
        netAmount: number;
    }
): Promise<QualityScore> {
    const validationResults: ValidationResult[] = [];

    // Range validation
    for (const [field, value] of Object.entries(data)) {
        if (field in RANGE_RULES) {
            const result = validateRange(field, value, RANGE_RULES[field as keyof typeof RANGE_RULES]);
            if (result) validationResults.push(result);
        }
    }

    // Outlier detection (get recent data for comparison)
    const recentSales = await prisma.canonicalSalesTransaction.findMany({
        where: {
            brandId,
            transactionDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
        },
        select: {
            unitPrice: true,
            totalAmount: true,
            quantity: true
        },
        take: 1000
    });

    if (recentSales.length > 10) {
        // Check unit price outliers
        const unitPrices = recentSales.map(s => Number(s.unitPrice));
        const priceOutlier = detectOutliers('unitPrice', data.unitPrice, unitPrices);
        if (priceOutlier) validationResults.push(priceOutlier);

        // Check total amount outliers
        const totalAmounts = recentSales.map(s => Number(s.totalAmount));
        const amountOutlier = detectOutliers('totalAmount', data.totalAmount, totalAmounts);
        if (amountOutlier) validationResults.push(amountOutlier);
    }

    // Calculate quality score
    return calculateQualityScore(data, 'sales', validationResults);
}

// ============================================
// VALIDATE ADS DATA
// ============================================

export async function validateAdsData(
    brandId: string,
    data: {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        revenue: number;
    }
): Promise<QualityScore> {
    const validationResults: ValidationResult[] = [];

    // Range validation
    for (const [field, value] of Object.entries(data)) {
        if (field in RANGE_RULES) {
            const result = validateRange(field, value, RANGE_RULES[field as keyof typeof RANGE_RULES]);
            if (result) validationResults.push(result);
        }
    }

    // Outlier detection
    const recentAds = await prisma.canonicalAdsMetric.findMany({
        where: {
            brandId,
            date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        },
        select: {
            impressions: true,
            clicks: true,
            spend: true,
            conversions: true,
            revenue: true
        },
        take: 1000
    });

    if (recentAds.length > 10) {
        // Check spend outliers
        const spends = recentAds.map(a => Number(a.spend));
        const spendOutlier = detectOutliers('spend', data.spend, spends);
        if (spendOutlier) validationResults.push(spendOutlier);

        // Check impressions outliers
        const impressions = recentAds.map(a => Number(a.impressions));
        const impressionOutlier = detectOutliers('impressions', data.impressions, impressions);
        if (impressionOutlier) validationResults.push(impressionOutlier);
    }

    // Calculate quality score
    return calculateQualityScore(data, 'ads', validationResults);
}

// ============================================
// VALIDATE FILE QUALITY
// ============================================

export async function validateFileQuality(fileId: string): Promise<{
    fileId: string;
    overallQuality: number;
    rowsAnalyzed: number;
    errorCount: number;
    warningCount: number;
    anomalyCount: number;
    qualityBreakdown: {
        completeness: number;
        accuracy: number;
        consistency: number;
    };
}> {
    const file = await prisma.rawImportFile.findUnique({
        where: { id: fileId },
        include: {
            rawRows: {
                where: { validationStatus: { in: ['valid', 'warning'] } },
                take: 1000
            }
        }
    });

    if (!file) {
        throw new Error('File not found');
    }

    let totalQuality = 0;
    let totalCompleteness = 0;
    let totalAccuracy = 0;
    let totalConsistency = 0;
    let errorCount = 0;
    let warningCount = 0;
    let anomalyCount = 0;

    for (const row of file.rawRows) {
        const errors = row.validationErrors as string[] || [];
        const warnings = row.validationWarnings as string[] || [];

        errorCount += errors.length;
        warningCount += warnings.length;

        // Simple quality calculation based on validation status
        const rowQuality = row.validationStatus === 'valid' ? 100 :
            row.validationStatus === 'warning' ? 75 : 0;
        totalQuality += rowQuality;
    }

    const avgQuality = file.rawRows.length > 0
        ? totalQuality / file.rawRows.length
        : 0;

    return {
        fileId,
        overallQuality: Math.round(avgQuality),
        rowsAnalyzed: file.rawRows.length,
        errorCount,
        warningCount,
        anomalyCount,
        qualityBreakdown: {
            completeness: Math.round(totalCompleteness / Math.max(file.rawRows.length, 1)),
            accuracy: Math.round(totalAccuracy / Math.max(file.rawRows.length, 1)),
            consistency: Math.round(totalConsistency / Math.max(file.rawRows.length, 1))
        }
    };
}
