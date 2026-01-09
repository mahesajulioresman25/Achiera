'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Upload and Process Settlement Report (CSV)
 * Currently supports Shopee Report Format
 */
export async function uploadSettlementReportAction(brandId: string, formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const platform = formData.get('platform') as string || 'SHOPEE'; // Default Shopee

        if (!file) {
            return { success: false, error: 'File not provided' };
        }

        const text = await file.text();
        const lines = text.split('\n');

        // Basic Parsing Logic (Can be enhanced with library later)
        // Shopee often has headers on specific lines. We'll look for "No. Pesanan"

        let headerIndex = -1;
        let headers: string[] = [];

        // Find header row
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            if (lines[i].includes('No. Pesanan') || lines[i].includes('Order ID')) {
                headerIndex = i;
                headers = lines[i].split(',').map(h => h.trim().replace(/"/g, ''));
                break;
            }
        }

        if (headerIndex === -1) {
            return { success: false, error: 'Format CSV tidak dikenali. Pastikan kolom "No. Pesanan" ada.' };
        }

        const batch = await prisma.settlementBatch.create({
            data: {
                brandId,
                platform,
                filename: file.name,
                totalAmount: 0,
                totalFees: 0,
                netAmount: 0,
                status: 'PROCESSING'
            }
        });

        let totalGross = 0;
        let totalFees = 0;
        let totalNet = 0;
        const items = [];

        // Process rows
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Handle CSV escaping quotes? For now assume simple CSV
            const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));

            // Map columns based on headers
            // Shopee: "No. Pesanan", ..., "Total Pembayaran Pembeli", "Potongan Biaya...", "Penghasilan Bersih"

            const orderIdVal = getCol(cols, headers, ['No. Pesanan', 'Order ID']);
            const netVal = getCol(cols, headers, ['Penghasilan Bersih', 'Net Amount', 'Total Penghasilan']);
            // Estimate others

            if (!orderIdVal) continue;

            const netAmount = parseFloat(netVal || '0');

            // For now, we store raw invoice and net amount
            // We need to fetch Order to calculate fees discrepancy

            // Just push to array for batch insert
            items.push({
                batchId: batch.id,
                invoiceNo: orderIdVal,
                amount: 0, // Need to parse gross
                fees: 0,
                netAmount: netAmount,
                status: 'UNMATCHED'
            });

            totalNet += netAmount;
        }

        // Batch Insert Items
        if (items.length > 0) {
            await prisma.settlementItem.createMany({
                data: items
            });
        }

        // Update Batch Totals
        await prisma.settlementBatch.update({
            where: { id: batch.id },
            data: {
                netAmount: totalNet,
                status: 'PROCESSED'
            }
        });

        revalidatePath('/dashboard/rasa-ibu/finance/reconciliation');
        return { success: true, batchId: batch.id, message: `Berhasil memproses ${items.length} baris.` };

    } catch (error: any) {
        console.error('Upload Settlement Error:', error);
        return { success: false, error: error.message };
    }
}

function getCol(cols: string[], headers: string[], keys: string[]) {
    const index = headers.findIndex(h => keys.some(k => h.includes(k)));
    if (index === -1) return null;
    return cols[index];
}

export async function getSettlementBatchesAction(brandId: string) {
    try {
        const batches = await prisma.settlementBatch.findMany({
            where: { brandId },
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(batches)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
