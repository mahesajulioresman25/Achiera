// ACHIERA Platform - Health & Integrity Checks
// Ledger balance, stock consistency, orphan transaction detection

import { prisma } from '@/lib/prisma';
import { verifyLedgerIntegrity } from './ledger-integrity';
import { triggerReadOnlyMode } from './degradation';
import { createLogger } from './logger';

type HealthCheckResult = {
    healthy: boolean;
    checks: {
        ledgerBalance: { passed: boolean; errors?: any[] };
        stockConsistency: { passed: boolean; errors?: any[] };
        orphanTransactions: { passed: boolean; count?: number };
    };
};

/**
 * Run all health checks
 */
export async function runHealthChecks(brandId?: string): Promise<HealthCheckResult> {
    const logger = createLogger({
        correlationId: 'HEALTH_CHECK',
        brandId,
        action: 'HEALTH_CHECK'
    });

    const result: HealthCheckResult = {
        healthy: true,
        checks: {
            ledgerBalance: { passed: true },
            stockConsistency: { passed: true },
            orphanTransactions: { passed: true }
        }
    };

    // Check ledger balance
    try {
        const ledgerCheck = await checkLedgerBalance(brandId);
        result.checks.ledgerBalance = ledgerCheck;

        if (!ledgerCheck.passed) {
            result.healthy = false;
            logger.error('Ledger balance check failed', undefined, {
                errors: ledgerCheck.errors
            });

            // Trigger read-only mode
            await triggerReadOnlyMode('Ledger imbalance detected');
        }
    } catch (error) {
        result.checks.ledgerBalance = { passed: false };
        result.healthy = false;
    }

    // Check stock consistency
    try {
        const stockCheck = await checkStockConsistency();
        result.checks.stockConsistency = stockCheck;

        if (!stockCheck.passed) {
            result.healthy = false;
            logger.error('Stock consistency check failed', undefined, {
                errors: stockCheck.errors
            });
        }
    } catch (error) {
        result.checks.stockConsistency = { passed: false };
        result.healthy = false;
    }

    // Check orphan transactions
    try {
        const orphanCheck = await checkOrphanTransactions();
        result.checks.orphanTransactions = orphanCheck;

        if (!orphanCheck.passed) {
            result.healthy = false;
            logger.warn('Orphan transactions detected', {
                count: orphanCheck.count
            });
        }
    } catch (error) {
        result.checks.orphanTransactions = { passed: false };
        result.healthy = false;
    }

    return result;
}

/**
 * Check ledger balance
 */
async function checkLedgerBalance(brandId?: string): Promise<{
    passed: boolean;
    errors?: any[];
}> {
    if (brandId) {
        const result = await verifyLedgerIntegrity(brandId);
        return {
            passed: result.isValid,
            errors: result.errors
        };
    }

    // Check all brands
    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true }
    });

    const allErrors = [];

    for (const brand of brands) {
        const result = await verifyLedgerIntegrity(brand.id);
        if (!result.isValid) {
            allErrors.push(...result.errors);
        }
    }

    return {
        passed: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Check stock consistency
 */
async function checkStockConsistency(): Promise<{
    passed: boolean;
    errors?: any[];
}> {
    const negativeStock = await prisma.frozenVariant.findMany({
        where: {
            stockOnHand: { lt: 0 }
        },
        select: {
            id: true,
            sku: true,
            stockOnHand: true
        }
    });

    return {
        passed: negativeStock.length === 0,
        errors: negativeStock
    };
}

/**
 * Check orphan transactions
 */
async function checkOrphanTransactions(): Promise<{
    passed: boolean;
    count?: number;
}> {
    // Find journal transactions without entries
    const orphans = await prisma.journalTransaction.findMany({
        where: {
            entries: {
                none: {}
            }
        }
    });

    return {
        passed: orphans.length === 0,
        count: orphans.length
    };
}
