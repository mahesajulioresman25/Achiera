// ACHIERA Platform - Analytics Import API
// Protected endpoints for Excel import

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AccessContext } from '@/lib/auth/requireAccess';
import { validateBrandAccess } from '@/lib/auth/brandIsolation';
import { importSalesData } from '@/lib/analytics/sales-import';
import { importAdsData } from '@/lib/analytics/ads-import';
import { extractOrGenerateCorrelationId } from '@/lib/hardening/correlation';
import { createLogger } from '@/lib/hardening/logger';

/**
 * Import Sales Data from Excel
 * POST /api/analytics/import/sales
 */
export const POST = withAuth(
    async (request: NextRequest, context: AccessContext) => {
        const correlationId = extractOrGenerateCorrelationId(request.headers);
        const logger = createLogger({
            correlationId,
            brandId: context.brandId,
            userId: context.userId,
            action: 'SALES_IMPORT'
        });

        try {
            const body = await request.json();
            const { brandId, rows } = body;

            // Validate brand access
            validateBrandAccess(context.brandId || null, brandId, context.role);

            logger.info('Starting sales import', { rowCount: rows.length });

            // Import data
            const summary = await importSalesData(brandId, context.userId, rows);

            logger.info('Sales import complete', {
                totalRows: summary.totalRows,
                validRows: summary.validRows,
                invalidRows: summary.invalidRows
            });

            return NextResponse.json({
                success: true,
                summary,
                correlationId
            });

        } catch (error) {
            logger.error('Sales import failed', error as Error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Import failed',
                    message: (error as Error).message
                },
                { status: 500 }
            );
        }
    },
    {
        permission: 'product:create' // Reuse product permission for imports
    }
);
