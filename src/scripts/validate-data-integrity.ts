// ACHIERA Platform - Data Integrity Validation Script
// Run this to verify data consistency across the system

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';

interface IntegrityIssue {
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    description: string;
    affectedRecords: number;
    details?: any;
}

/**
 * Check for orphan records (records without required parent)
 */
async function checkOrphanRecords(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Orphan orders (no brand)
    const orphanOrders = await prisma.order.count({
        where: { brand: null }
    });
    if (orphanOrders > 0) {
        issues.push({
            severity: 'CRITICAL',
            category: 'ORPHAN_RECORDS',
            description: 'Orders without brand reference',
            affectedRecords: orphanOrders
        });
    }

    // Orphan order items (no order)
    const orphanOrderItems = await prisma.orderItem.count({
        where: { order: null }
    });
    if (orphanOrderItems > 0) {
        issues.push({
            severity: 'HIGH',
            category: 'ORPHAN_RECORDS',
            description: 'Order items without order reference',
            affectedRecords: orphanOrderItems
        });
    }

    // Orphan payments (no order)
    const orphanPayments = await prisma.payment.count({
        where: { order: null }
    });
    if (orphanPayments > 0) {
        issues.push({
            severity: 'CRITICAL',
            category: 'ORPHAN_RECORDS',
            description: 'Payments without order reference',
            affectedRecords: orphanPayments
        });
    }

    return issues;
}

/**
 * Check for negative stock
 */
async function checkNegativeStock(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    const negativeStock = await prisma.frozenVariant.findMany({
        where: { stockOnHand: { lt: 0 } },
        select: { id: true, name: true, stockOnHand: true }
    });

    if (negativeStock.length > 0) {
        issues.push({
            severity: 'CRITICAL',
            category: 'STOCK_INTEGRITY',
            description: 'Variants with negative stock',
            affectedRecords: negativeStock.length,
            details: negativeStock
        });
    }

    return issues;
}

/**
 * Verify ledger balance for all brands
 */
async function checkLedgerBalance(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    const brands = await prisma.brand.findMany();

    for (const brand of brands) {
        const result = await verifyLedgerIntegrity(brand.id);

        if (!result.isValid) {
            issues.push({
                severity: 'CRITICAL',
                category: 'LEDGER_INTEGRITY',
                description: `Ledger imbalance for brand: ${brand.name}`,
                affectedRecords: result.errors.length,
                details: result.errors
            });
        }
    }

    return issues;
}

/**
 * Check for missing required accounts
 */
async function checkRequiredAccounts(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    const requiredAccounts = ['1000-CASH', '4000-REVENUE', '5000-COGS'];

    const brands = await prisma.brand.findMany();

    for (const brand of brands) {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId: brand.id },
            select: { code: true }
        });

        const accountCodes = accounts.map(a => a.code);
        const missing = requiredAccounts.filter(code => !accountCodes.includes(code));

        if (missing.length > 0) {
            issues.push({
                severity: 'HIGH',
                category: 'MISSING_ACCOUNTS',
                description: `Brand "${brand.name}" missing required accounts`,
                affectedRecords: missing.length,
                details: { brandId: brand.id, missingAccounts: missing }
            });
        }
    }

    return issues;
}

/**
 * Check stock vs inventory batch consistency
 */
async function checkStockBatchConsistency(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    const variants = await prisma.frozenVariant.findMany({
        include: {
            batches: true
        }
    });

    for (const variant of variants) {
        const batchTotal = variant.batches.reduce((sum, batch) => sum + batch.quantity, 0);

        if (batchTotal !== variant.stockOnHand) {
            issues.push({
                severity: 'HIGH',
                category: 'STOCK_BATCH_MISMATCH',
                description: `Stock mismatch for variant: ${variant.name}`,
                affectedRecords: 1,
                details: {
                    variantId: variant.id,
                    stockOnHand: variant.stockOnHand,
                    batchTotal
                }
            });
        }
    }

    return issues;
}

/**
 * Check for duplicate idempotency keys (should never happen)
 */
async function checkIdempotencyDuplicates(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    const duplicates = await prisma.$queryRaw<Array<{ key: string; count: number }>>`
        SELECT "key", COUNT(*) as count
        FROM "idempotency_records"
        GROUP BY "key"
        HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
        issues.push({
            severity: 'CRITICAL',
            category: 'IDEMPOTENCY_VIOLATION',
            description: 'Duplicate idempotency keys detected',
            affectedRecords: duplicates.length,
            details: duplicates
        });
    }

    return issues;
}

/**
 * Main validation function
 */
export async function validateDataIntegrity(): Promise<{
    isValid: boolean;
    issues: IntegrityIssue[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}> {
    console.log('Starting data integrity validation...\n');

    const allIssues: IntegrityIssue[] = [];

    // Run all checks
    const checks = [
        { name: 'Orphan Records', fn: checkOrphanRecords },
        { name: 'Negative Stock', fn: checkNegativeStock },
        { name: 'Ledger Balance', fn: checkLedgerBalance },
        { name: 'Required Accounts', fn: checkRequiredAccounts },
        { name: 'Stock-Batch Consistency', fn: checkStockBatchConsistency },
        { name: 'Idempotency Duplicates', fn: checkIdempotencyDuplicates }
    ];

    for (const check of checks) {
        console.log(`Running: ${check.name}...`);
        const issues = await check.fn();
        allIssues.push(...issues);
        console.log(`  Found ${issues.length} issues\n`);
    }

    // Summarize by severity
    const summary = {
        critical: allIssues.filter(i => i.severity === 'CRITICAL').length,
        high: allIssues.filter(i => i.severity === 'HIGH').length,
        medium: allIssues.filter(i => i.severity === 'MEDIUM').length,
        low: allIssues.filter(i => i.severity === 'LOW').length
    };

    console.log('Validation Complete\n');
    console.log('Summary:');
    console.log(`  CRITICAL: ${summary.critical}`);
    console.log(`  HIGH: ${summary.high}`);
    console.log(`  MEDIUM: ${summary.medium}`);
    console.log(`  LOW: ${summary.low}`);
    console.log(`  Total: ${allIssues.length}\n`);

    if (allIssues.length > 0) {
        console.log('Issues Found:');
        allIssues.forEach((issue, index) => {
            console.log(`\n${index + 1}. [${issue.severity}] ${issue.category}`);
            console.log(`   ${issue.description}`);
            console.log(`   Affected Records: ${issue.affectedRecords}`);
            if (issue.details) {
                console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
            }
        });
    }

    return {
        isValid: summary.critical === 0 && summary.high === 0,
        issues: allIssues,
        summary
    };
}

// CLI execution
if (require.main === module) {
    validateDataIntegrity()
        .then(result => {
            process.exit(result.isValid ? 0 : 1);
        })
        .catch(error => {
            console.error('Validation failed:', error);
            process.exit(1);
        });
}
