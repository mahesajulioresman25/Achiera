// ACHIERA Autonomous Analytics - File Processing Service
// Handles CSV/Excel upload, parsing, and raw storage

import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import * as XLSX from 'xlsx';
import { inferHeaders, type InferenceResult } from './header-inference';

export interface FileUploadResult {
    fileId: string;
    fileName: string;
    fileHash: string;
    rowCount: number;
    inferenceResult: InferenceResult;
    processingStatus: 'auto_approved' | 'manual_review_required' | 'rejected';
}

/**
 * Calculate SHA256 hash of file content
 */
function calculateFileHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
}

/**
 * Parse CSV file
 */
function parseCSV(content: Buffer): { headers: string[]; rows: any[][] } {
    const text = content.toString('utf-8');
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        throw new Error('Empty CSV file');
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse rows
    const rows: any[][] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        rows.push(values);
    }

    return { headers, rows };
}

/**
 * Parse Excel file
 */
function parseExcel(content: Buffer): { headers: string[]; rows: any[][] } {
    const workbook = XLSX.read(content, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length === 0) {
        throw new Error('Empty Excel file');
    }

    const headers = data[0].map((h: any) => String(h).trim());
    const rows = data.slice(1);

    return { headers, rows };
}

/**
 * Process uploaded file
 */
export async function processUploadedFile(
    brandId: string,
    userId: string,
    fileName: string,
    fileContent: Buffer,
    platformHint?: string
): Promise<FileUploadResult> {
    // Calculate file hash
    const fileHash = calculateFileHash(fileContent);

    // Check for duplicate
    const existingFile = await prisma.rawImportFile.findFirst({
        where: { brandId, fileHash }
    });

    if (existingFile) {
        throw new Error('File already uploaded');
    }

    // Determine file type
    const fileType = fileName.endsWith('.csv') ? 'csv' : 'excel';

    // Parse file
    const { headers, rows } = fileType === 'csv'
        ? parseCSV(fileContent)
        : parseExcel(fileContent);

    if (headers.length === 0 || rows.length === 0) {
        throw new Error('Invalid file: no data found');
    }

    // Run header inference
    const sampleRows = rows.slice(0, 100); // First 100 rows for inference
    const inferenceResult = await inferHeaders(fileName, headers, sampleRows);

    // Determine processing status
    let processingStatus: 'auto_approved' | 'manual_review_required' | 'rejected';
    if (inferenceResult.blockingIssues.length > 0) {
        processingStatus = 'rejected';
    } else if (inferenceResult.overallConfidence >= 0.85) {
        processingStatus = 'auto_approved';
    } else if (inferenceResult.overallConfidence >= 0.70) {
        processingStatus = 'manual_review_required';
    } else {
        processingStatus = 'rejected';
    }

    // Create file record
    const file = await prisma.rawImportFile.create({
        data: {
            brandId,
            fileName,
            fileType,
            fileSizeBytes: fileContent.length,
            fileHash,
            fileStoragePath: `/uploads/${brandId}/${fileHash}`, // TODO: Implement blob storage
            uploadedBy: userId,
            platformHint,
            processingStatus,
            rowCount: rows.length,
            validRowCount: 0,
            errorRowCount: 0
        }
    });

    // Store raw rows
    for (let i = 0; i < rows.length; i++) {
        const rowData: Record<string, any> = {};
        for (let j = 0; j < headers.length; j++) {
            rowData[headers[j]] = rows[i][j];
        }

        await prisma.rawRow.create({
            data: {
                fileId: file.id,
                brandId,
                rowNumber: i + 1,
                rawData: rowData,
                validationStatus: 'pending'
            }
        });
    }

    // Store schema mappings
    for (const mapping of inferenceResult.mappings) {
        await prisma.inferredSchemaMapping.create({
            data: {
                fileId: file.id,
                brandId,
                sourceColumnName: mapping.sourceColumnName,
                sourceColumnIndex: mapping.sourceColumnIndex,
                canonicalField: mapping.canonicalField || 'unknown',
                inferenceMethod: mapping.inferenceMethod,
                confidenceScore: mapping.confidence,
                sampleValues: mapping.sampleValues,
                dataType: mapping.dataType
            }
        });
    }

    // Store confidence score
    await prisma.schemaConfidenceScore.create({
        data: {
            fileId: file.id,
            overallConfidence: inferenceResult.overallConfidence,
            blockingIssues: inferenceResult.blockingIssues,
            warnings: inferenceResult.warnings,
            autoApproved: processingStatus === 'auto_approved',
            manualReviewRequired: processingStatus === 'manual_review_required'
        }
    });

    return {
        fileId: file.id,
        fileName: file.fileName,
        fileHash: file.fileHash,
        rowCount: rows.length,
        inferenceResult,
        processingStatus
    };
}
