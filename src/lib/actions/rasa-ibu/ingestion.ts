'use server';

import { prisma } from '@/lib/prisma';
import { inferHeaders, InferenceResult, CanonicalField } from '@/lib/autonomous-analytics/header-inference';
import { revalidatePath } from 'next/cache';

/**
 * processIngestion
 * Parses CSV (simplified) and runs Achiera's inference engine.
 */
export async function processIngestion(fileName: string, rawCsvContent: string) {
    try {
        const lines = rawCsvContent.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error('File CSV kosong atau tidak valid.');

        // Simple CSV parser supporting quotes
        const parseLine = (line: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const headers = parseLine(lines[0]);
        const sampleRows = lines.slice(1, 6).map(line => parseLine(line));

        const inferenceResult = await inferHeaders(fileName, headers, sampleRows);

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                headers,
                sampleRows,
                inference: inferenceResult
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * executeIngestion
 * Maps data to Prisma models and batches create.
 */
export async function executeIngestion(
    brandId: string,
    headers: string[],
    rows: string[][],
    mappings: Record<number, CanonicalField>,
    warehouseId?: string
) {
    try {
        const ordersToCreate = [];

        for (const row of rows) {
            const orderData: any = {
                brandId,
                status: 'DIPESAN', // Align with Phase 7.0 manual flow
                items: [],
                totalAmount: 0
            };

            // Map columns based on inference
            Object.entries(mappings).forEach(([indexStr, field]) => {
                const index = parseInt(indexStr);
                const value = row[index];

                if (!value) return;

                switch (field) {
                    case 'order_id':
                        orderData.manualRef = value;
                        break;
                    case 'customer_name':
                        orderData.customerName = value;
                        break;
                    case 'transaction_date':
                        orderData.createdAt = new Date(value);
                        break;
                    case 'total_amount':
                        orderData.totalAmount = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
                        break;
                    default:
                        // Collect unmapped but relevant data into internal notes or items
                        break;
                }
            });

            if (orderData.manualRef && orderData.totalAmount > 0) {
                ordersToCreate.push(orderData);
            }
        }

        // Batch Create (Simplified)
        for (const data of ordersToCreate) {
            const { items, ...orderRest } = data;
            await prisma.order.create({
                data: {
                    ...orderRest,
                    warehouse: warehouseId ? { connect: { id: warehouseId } } : undefined
                } as any
            });
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, count: ordersToCreate.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
