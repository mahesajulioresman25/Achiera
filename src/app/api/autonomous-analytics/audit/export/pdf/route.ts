// PDF Export API - GET /api/autonomous-analytics/audit/export/pdf
// Exports audit logs as PDF file

import { NextRequest, NextResponse } from 'next/server';
import { exportAuditPDF } from '@/lib/autonomous-analytics/audit/audit-export';

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

        // Export PDF (returns Buffer)
        const pdfBuffer = await exportAuditPDF({
            brandId,
            startDate,
            endDate,
            format: 'pdf',
            includeExecutions: true,
            includeApprovals: true,
            includeOverrides: true,
            includeRollbacks: true
        });

        // Return as downloadable file
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="audit-logs-${brandId}-${new Date().toISOString()}.pdf"`
            }
        });
    } catch (error) {
        console.error('Error exporting PDF:', error);
        return NextResponse.json(
            { error: 'Failed to export PDF' },
            { status: 500 }
        );
    }
}
