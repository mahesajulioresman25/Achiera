// ACHIERA Platform - Sales Excel Import Engine
// Validates, normalizes, and imports sales data from Excel

import { prisma } from '@/lib/prisma';
import { writeAnalyticsEvent, trackProductSold } from './event-writer';
import { v4 as uuidv4 } from 'uuid';

interface SalesImportRow {
    rowNumber: number;
    transactionDate: string;
    orderId?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discount?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    salesChannel?: string;
    platform?: string;
    notes?: string;
}

interface ValidationResult {
    status: 'valid' | 'invalid' | 'warning';
    errors: string[];
    warnings: string[];
}

interface ImportSummary {
    importId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warningRows: number;
    errors: Array<{ row: number; errors: string[] }>;
    warnings: Array<{ row: number; warnings: string[] }>;
}

/**
 * Validate single sales row
 */
function validateSalesRow(row: SalesImportRow): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!row.transactionDate) {
        errors.push('Transaction date is required');
    }
    if (!row.productName || row.productName.trim() === '') {
        errors.push('Product name is required');
    }
    if (row.quantity === undefined || row.quantity === null) {
        errors.push('Quantity is required');
    }
    if (row.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }
    if (row.unitPrice === undefined || row.unitPrice === null) {
        errors.push('Unit price is required');
    }
    if (row.unitPrice < 0) {
        errors.push('Unit price cannot be negative');
    }
    if (row.totalAmount === undefined || row.totalAmount === null) {
        errors.push('Total amount is required');
    }

    // Date format validation
    if (row.transactionDate) {
        const dateFormats = [
            /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
            /^\d{2}-\d{2}-\d{4}$/    // DD-MM-YYYY
        ];
        const isValidFormat = dateFormats.some(format => format.test(row.transactionDate));
        if (!isValidFormat) {
            errors.push('Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY');
        }
    }

    // Warnings
    if (!row.productSku) {
        warnings.push('Product SKU not provided - will attempt fuzzy match by name');
    }
    if (!row.customerName && !row.customerPhone && !row.customerEmail) {
        warnings.push('No customer information provided');
    }
    if (row.totalAmount !== row.quantity * row.unitPrice - (row.discount || 0)) {
        warnings.push('Total amount does not match quantity × unit price - discount');
    }

    const status = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';
    return { status, errors, warnings };
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

        // Try DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-');
            return new Date(`${year}-${month}-${day}`);
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Fuzzy match product by name or SKU
 */
async function matchProduct(
    brandId: string,
    productName: string,
    productSku?: string
): Promise<{ productId: string | null; variantId: string | null; confidence: number }> {
    // Try exact SKU match first
    if (productSku) {
        const variant = await prisma.frozenVariant.findFirst({
            where: {
                sku: productSku,
                product: { category: { brandId } }
            },
            select: {
                id: true,
                productId: true
            }
        });

        if (variant) {
            return { productId: variant.productId, variantId: variant.id, confidence: 1.0 };
        }
    }

    // Try fuzzy name match
    const products = await prisma.frozenProduct.findMany({
        where: {
            category: { brandId },
            name: { contains: productName.trim() }
        },
        include: {
            variants: {
                take: 1
            }
        },
        take: 5
    });

    if (products.length === 0) {
        return { productId: null, variantId: null, confidence: 0 };
    }

    // Simple similarity score (can be improved with Levenshtein distance)
    const scores = products.map(p => {
        const nameLower = p.name.toLowerCase();
        const searchLower = productName.toLowerCase().trim();

        if (nameLower === searchLower) return 1.0;
        if (nameLower.includes(searchLower)) return 0.8;
        if (searchLower.includes(nameLower)) return 0.7;

        // Word overlap
        const nameWords = nameLower.split(/\s+/);
        const searchWords = searchLower.split(/\s+/);
        const overlap = nameWords.filter(w => searchWords.includes(w)).length;
        return overlap / Math.max(nameWords.length, searchWords.length);
    });

    const bestIndex = scores.indexOf(Math.max(...scores));
    const bestProduct = products[bestIndex];
    const confidence = scores[bestIndex];

    return {
        productId: bestProduct.id,
        variantId: bestProduct.variants[0]?.id || null,
        confidence
    };
}

/**
 * Import sales data from Excel
 */
export async function importSalesData(
    brandId: string,
    userId: string,
    rows: SalesImportRow[]
): Promise<ImportSummary> {
    const importId = uuidv4();
    const summary: ImportSummary = {
        importId,
        totalRows: rows.length,
        validRows: 0,
        invalidRows: 0,
        warningRows: 0,
        errors: [],
        warnings: []
    };

    // Process each row
    for (const row of rows) {
        const validation = validateSalesRow(row);

        // Store raw row
        const rawRow = await prisma.salesImportRaw.create({
            data: {
                importId,
                brandId,
                rowNumber: row.rowNumber,
                transactionDate: row.transactionDate,
                orderId: row.orderId,
                productName: row.productName,
                productSku: row.productSku,
                quantity: row.quantity,
                unitPrice: row.unitPrice,
                totalAmount: row.totalAmount,
                discount: row.discount,
                customerName: row.customerName,
                customerPhone: row.customerPhone,
                customerEmail: row.customerEmail,
                salesChannel: row.salesChannel,
                platform: row.platform,
                notes: row.notes,
                importedBy: userId,
                validationStatus: validation.status,
                validationErrors: validation.errors.length > 0 ? validation.errors : null,
                validationWarnings: validation.warnings.length > 0 ? validation.warnings : null
            }
        });

        // Track summary
        if (validation.status === 'invalid') {
            summary.invalidRows++;
            summary.errors.push({ row: row.rowNumber, errors: validation.errors });
        } else if (validation.status === 'warning') {
            summary.warningRows++;
            summary.warnings.push({ row: row.rowNumber, warnings: validation.warnings });
        } else {
            summary.validRows++;
        }

        // Normalize valid rows
        if (validation.status !== 'invalid') {
            // Match product
            const match = await matchProduct(brandId, row.productName, row.productSku);

            if (match.productId && match.variantId) {
                await prisma.salesImportRaw.update({
                    where: { id: rawRow.id },
                    data: {
                        normalizedProductId: match.productId,
                        normalizedVariantId: match.variantId
                    }
                });

                // Create analytics event
                const normalizedDate = normalizeDate(row.transactionDate);
                if (normalizedDate) {
                    await trackProductSold(brandId, {
                        productId: match.productId,
                        variantId: match.variantId,
                        quantity: row.quantity,
                        revenue: row.totalAmount,
                        orderId: row.orderId || `import_${importId}_row_${row.rowNumber}`,
                        channel: row.salesChannel,
                        platform: row.platform
                    });
                }
            }
        }
    }

    // Create import summary event
    await writeAnalyticsEvent({
        brandId,
        eventType: 'sales.order_created',
        payload: {
            importId,
            totalRows: summary.totalRows,
            validRows: summary.validRows,
            invalidRows: summary.invalidRows
        },
        source: 'import',
        sourceId: importId,
        createdBy: userId
    });

    return summary;
}
