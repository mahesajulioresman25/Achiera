// ACHIERA Platform - Restore Verification Script
// Verifies database integrity after restore

import { prisma } from '@/lib/prisma';
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';
import { validateDataIntegrity } from './validate-data-integrity';

interface VerificationResult {
    passed: boolean;
    checks: Array<{
        name: string;
        status: 'PASS' | 'FAIL' | 'WARN';
        details?: any;
    }>;
}

/**
 * Verify database restore
 */
export async function verifyRestore(): Promise<VerificationResult> {
    console.log('Starting restore verification...\n');

    const checks: VerificationResult['checks'] = [];

    // 1. Table count
    try {
        const tables = await prisma.$queryRaw<Array<any>>`SHOW TABLES`;
        const tableCount = tables.length;

        checks.push({
            name: 'Table Count',
            status: tableCount >= 25 ? 'PASS' : 'FAIL',
            details: { count: tableCount, expected: '≥25' }
        });
    } catch (error) {
        checks.push({
            name: 'Table Count',
            status: 'FAIL',
            details: { error: (error as Error).message }
        });
    }

    // 2. Record counts
    try {
        const brands = await prisma.brand.count();
        const orders = await prisma.order.count();
        const users = await prisma.user.count();

        checks.push({
            name: 'Record Counts',
            status: 'PASS',
            details: { brands, orders, users }
        });
    } catch (error) {
        checks.push({
            name: 'Record Counts',
            status: 'FAIL',
            details: { error: (error as Error).message }
        });
    }

    // 3. Ledger integrity for all brands
    try {
        const brands = await prisma.brand.findMany();
        let allValid = true;
        const ledgerResults: any[] = [];

        for (const brand of brands) {
            const ledgerCheck = await verifyLedgerIntegrity(brand.id);
            ledgerResults.push({
                brandId: brand.id,
                brandName: brand.name,
                valid: ledgerCheck.isValid,
                errors: ledgerCheck.errors.length
            });

            if (!ledgerCheck.isValid) {
                allValid = false;
            }
        }

        checks.push({
            name: 'Ledger Integrity',
            status: allValid ? 'PASS' : 'FAIL',
            details: ledgerResults
        });
    } catch (error) {
        checks.push({
            name: 'Ledger Integrity',
            status: 'FAIL',
            details: { error: (error as Error).message }
        });
    }

    // 4. Data integrity
    try {
        const integrityCheck = await validateDataIntegrity();

        checks.push({
            name: 'Data Integrity',
            status: integrityCheck.isValid ? 'PASS' : 'FAIL',
            details: {
                critical: integrityCheck.summary.critical,
                high: integrityCheck.summary.high,
                total: integrityCheck.issues.length
            }
        });
    } catch (error) {
        checks.push({
            name: 'Data Integrity',
            status: 'FAIL',
            details: { error: (error as Error).message }
        });
    }

    // 5. Foreign key constraints
    try {
        const orphanOrders = await prisma.order.count({
            where: { brand: null }
        });
        const orphanPayments = await prisma.payment.count({
            where: { order: null }
        });

        checks.push({
            name: 'Foreign Key Integrity',
            status: (orphanOrders === 0 && orphanPayments === 0) ? 'PASS' : 'FAIL',
            details: { orphanOrders, orphanPayments }
        });
    } catch (error) {
        checks.push({
            name: 'Foreign Key Integrity',
            status: 'FAIL',
            details: { error: (error as Error).message }
        });
    }

    // 6. Index integrity
    try {
        // Verify critical indexes exist
        const indexes = await prisma.$queryRaw<Array<any>>`
            SELECT DISTINCT TABLE_NAME, INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND INDEX_NAME != 'PRIMARY'
        `;

        checks.push({
            name: 'Index Integrity',
            status: indexes.length > 0 ? 'PASS' : 'WARN',
            details: { indexCount: indexes.length }
        });
    } catch (error) {
        checks.push({
            name: 'Index Integrity',
            status: 'WARN',
            details: { error: (error as Error).message }
        });
    }

    // Summary
    const passed = checks.every(c => c.status === 'PASS' || c.status === 'WARN');
    const failed = checks.filter(c => c.status === 'FAIL');

    console.log('\nVerification Results:');
    console.log('='.repeat(50));

    checks.forEach(check => {
        const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
        console.log(`${icon} ${check.name}: ${check.status}`);
        if (check.details) {
            console.log(`   ${JSON.stringify(check.details, null, 2)}`);
        }
    });

    console.log('='.repeat(50));
    console.log(`\nOverall: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (failed.length > 0) {
        console.log(`\nFailed Checks (${failed.length}):`);
        failed.forEach(f => console.log(`  - ${f.name}`));
    }

    return { passed, checks };
}

// CLI execution
if (require.main === module) {
    verifyRestore()
        .then(result => {
            process.exit(result.passed ? 0 : 1);
        })
        .catch(error => {
            console.error('Verification failed:', error);
            process.exit(1);
        });
}
