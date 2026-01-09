// Audit CSV Export API - GET /api/autonomous-analytics/audit/export/csv
// Exports audit logs as CSV file

import { NextRequest, NextResponse } from 'next/server';
import { exportAuditCSV } from '@/lib/autonomous-analytics/audit/audit-export';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const dateRange = searchParams.get('dateRange') || '7days';

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === '7days') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
            startDate.setDate(startDate.getDate() - 30);
        }

        // Export CSV
        const csv = await exportAuditCSV({
            brandId,
            startDate,
            endDate,
            format: 'csv',
            includeExecutions: true,
            includeApprovals: true,
            includeOverrides: true,
            includeRollbacks: true
        });

        // Return as downloadable file
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="audit-logs-${brandId}-${new Date().toISOString()}.csv"`
            }
        });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        return NextResponse.json(
            { error: 'Failed to export CSV' },
            { status: 500 }
        );
    }
}
