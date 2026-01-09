// ACHIERA Autonomous Analytics - Ingestion API
// POST /api/autonomous-analytics/ingest

import { NextRequest, NextResponse } from 'next/server';
import { processUploadedFile } from '@/lib/autonomous-analytics/file-processor';
import { processFileToCanonical } from '@/lib/autonomous-analytics/canonical-transformer';
import { loadSalesFacts, loadAdsPerformanceFacts } from '@/lib/autonomous-analytics/fact-loader';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const brandId = formData.get('brandId') as string;
        const userId = formData.get('userId') as string;
        const platformHint = formData.get('platformHint') as string | undefined;

        if (!file || !brandId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: file, brandId, userId' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process file
        const uploadResult = await processUploadedFile(
            brandId,
            userId,
            file.name,
            buffer,
            platformHint
        );

        // If auto-approved, process to canonical and facts
        if (uploadResult.processingStatus === 'auto_approved') {
            try {
                // Transform to canonical
                await processFileToCanonical(uploadResult.fileId);

                // Load to facts
                await loadSalesFacts(brandId);
                await loadAdsPerformanceFacts(brandId);

                return NextResponse.json({
                    success: true,
                    fileId: uploadResult.fileId,
                    status: 'completed',
                    rowCount: uploadResult.rowCount,
                    confidence: uploadResult.inferenceResult.overallConfidence,
                    message: 'File processed successfully'
                });
            } catch (error) {
                return NextResponse.json({
                    success: false,
                    fileId: uploadResult.fileId,
                    status: 'processing_failed',
                    error: (error as Error).message
                }, { status: 500 });
            }
        }

        // Manual review required or rejected
        return NextResponse.json({
            success: uploadResult.processingStatus !== 'rejected',
            fileId: uploadResult.fileId,
            status: uploadResult.processingStatus,
            rowCount: uploadResult.rowCount,
            confidence: uploadResult.inferenceResult.overallConfidence,
            blockingIssues: uploadResult.inferenceResult.blockingIssues,
            warnings: uploadResult.inferenceResult.warnings,
            message: uploadResult.processingStatus === 'manual_review_required'
                ? 'Manual review required'
                : 'File rejected due to low confidence'
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'File processing failed',
                message: (error as Error).message
            },
            { status: 500 }
        );
    }
}
