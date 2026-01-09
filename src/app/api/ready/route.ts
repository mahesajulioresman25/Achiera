// ACHIERA Platform - Readiness Check Endpoint
// Comprehensive dependency health check

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';

export const dynamic = 'force-dynamic';

interface HealthCheck {
    name: string;
    status: 'pass' | 'fail';
    duration?: number;
    error?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            name: 'database',
            status: 'pass',
            duration: Date.now() - start
        };
    } catch (error) {
        return {
            name: 'database',
            status: 'fail',
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkLedgerIntegrity(): Promise<HealthCheck> {
    const start = Date.now();
    try {
        // Check first brand only for readiness (full check is expensive)
        const firstBrand = await prisma.brand.findFirst();
        if (!firstBrand) {
            return {
                name: 'ledger',
                status: 'pass',
                duration: Date.now() - start
            };
        }

        const result = await verifyLedgerIntegrity(firstBrand.id);
        return {
            name: 'ledger',
            status: result.isValid ? 'pass' : 'fail',
            duration: Date.now() - start,
            error: result.isValid ? undefined : `Imbalance detected: ${result.errors.length} transactions`
        };
    } catch (error) {
        return {
            name: 'ledger',
            status: 'fail',
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function GET() {
    const checks = await Promise.allSettled([
        checkDatabase(),
        checkLedgerIntegrity()
    ]);

    const results: HealthCheck[] = checks.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            name: ['database', 'ledger'][index],
            status: 'fail',
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
    });

    const allHealthy = results.every(check => check.status === 'pass');

    return NextResponse.json(
        {
            status: allHealthy ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            checks: results
        },
        { status: allHealthy ? 200 : 503 }
    );
}
