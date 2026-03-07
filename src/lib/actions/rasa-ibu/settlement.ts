'use server';

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { buildPrompt } from '@/lib/autonomous-analytics/ai/prompt-builder';
import { PromptType } from '@/lib/autonomous-analytics/ai/types';
import { getAccountByCode, initializeChartOfAccounts } from '@/lib/intelligence/chartOfAccounts';
import { JournalService } from '@/lib/intelligence/journalService';
import { revalidatePath } from 'next/cache';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * AI-Powered Settlement Email Parsing
 */
export async function parseSettlementEmailAction(brandId: string, rawContent: string) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY not found in environment.");
        }

        const { prompt, systemPrompt, maxTokens, temperature } = buildPrompt({
            type: PromptType.SETTLEMENT_PARSING,
            context: { brand: { brandId } } as any, // Minimal context needed
            options: { rawContent }
        });

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const text = (response.content[0] as any).text;
        const aiOutput = extractJSON(text);

        return { success: true, data: aiOutput };
    } catch (error: any) {
        console.error('[Settlement] AI Parsing failed:', error);
        return { success: false, error: error.message };
    }
}

/**
     * CSV Parsing for Settlement (Shopee)
     */
export async function parseSettlementCSVAction(brandId: string, formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'File wajib diunggah.' };

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        // Detect Headers & Delimiter
        let headerIndex = -1;
        let headers: string[] = [];
        let delimiter = ',';

        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i];

            // Key identifiers: "No. Pesanan" (Shopee Regular), "Order ID" (Shopee Food)
            if (line.includes('No. Pesanan') || line.includes('Order ID')) {
                headerIndex = i;

                // Detect delimiter strategy
                if (line.includes(';') && !line.includes(',')) {
                    delimiter = ';';
                } else if (line.includes(',') && !line.includes(';')) {
                    delimiter = ',';
                } else {
                    const commaCount = (line.match(/,/g) || []).length;
                    const semiCount = (line.match(/;/g) || []).length;
                    delimiter = semiCount > commaCount ? ';' : ',';
                }

                headers = parseCSVLine(line, delimiter);
                break;
            }
        }

        if (headerIndex === -1) {
            return { success: false, error: 'Format CSV tidak dikenali. Pastikan ada header "No. Pesanan" atau "Order ID".' };
        }

        const orders = [];
        let totalNet = 0;

        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const cols = parseCSVLine(line, delimiter);
            if (cols.length < headers.length) continue;

            // Map columns based on headers with prioritization
            // Order ID Detection
            const orderIdIdx = headers.findIndex(h =>
                h.includes('No. Pesanan') ||
                h.includes('Order ID') ||
                h.includes('Order SN') ||
                h.includes('Reference')
            );

            // Net Amount Detection (What you actually get)
            const netAmountIdx = headers.findIndex(h =>
                h.includes('Net Income') ||
                h.includes('Net Payout') ||
                h.includes('Penghasilan Bersih') ||
                h.includes('Payout Amount') ||
                h.includes('Net Amount')
            );

            // Gross Amount Detection (Customer pays)
            const grossAmountIdx = headers.findIndex(h =>
                h.includes('Order Amount') ||
                h.includes('Subtotal') ||
                h.includes('Total') ||
                h.includes('Original Amount')
            );

            // Fees Detection
            const feesIdx = headers.findIndex(h =>
                h.includes('Commission') ||
                h.includes('Biaya Admin') ||
                h.includes('Service Charge') ||
                h.includes('Merchant Service Charge') ||
                h.includes('Merchant Fee')
            );

            if (orderIdIdx === -1 || netAmountIdx === -1) continue;

            const orderId = cols[orderIdIdx].replace(/['"]/g, '');

            const parseAmount = (val: string) => {
                if (!val) return 0;
                // Remove currency symbol, whitespace, and thousands separators
                // Indonesian: 15.000,00 -> 15000.00
                // International: 15,000.00 -> 15000.00
                const clean = val.replace(/[Rp\s]/g, '');
                if (clean.includes(',') && clean.includes('.')) {
                    // Hybrid format, check which is decimal
                    return clean.indexOf(',') > clean.indexOf('.') ?
                        parseFloat(clean.replace(/\./g, '').replace(',', '.')) :
                        parseFloat(clean.replace(/,/g, ''));
                }
                // Single separator format
                if (clean.includes(',')) {
                    // Check if it's 1.000 (thousand) or 1,00 (decimal)
                    // If it has 2 digits after comma, likely decimal
                    const parts = clean.split(',');
                    if (parts[parts.length - 1].length === 2) return parseFloat(clean.replace(',', '.'));
                    return parseFloat(clean.replace(',', ''));
                }
                return parseFloat(clean) || 0;
            };

            const netAmount = parseAmount(cols[netAmountIdx]);
            const grossAmount = grossAmountIdx !== -1 ? parseAmount(cols[grossAmountIdx]) : netAmount;
            const fees = feesIdx !== -1 ? parseAmount(cols[feesIdx]) : (grossAmount - netAmount);

            if (!isNaN(netAmount)) {
                orders.push({
                    externalOrderId: orderId,
                    grossAmount: grossAmount,
                    fees: Math.max(0, fees),
                    netAmount: netAmount,
                    description: `Shopee Settlement CSV (${headers[netAmountIdx]})`
                });
                totalNet += netAmount;
            }
        }

        return {
            success: true,
            data: {
                platform: 'SHOPEE',
                settlementDate: new Date().toISOString().split('T')[0], // CSV doesn't always have header date, default to today
                currency: 'IDR',
                orders,
                totalNetPayout: totalNet,
                confidence: 0.95
            }
        };

    } catch (error: any) {
        console.error('[Settlement] CSV Parsing failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper: Parse CSV Line handling quotes
 */
function parseCSVLine(line: string, delimiter: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === delimiter && !inQuotes) {
            result.push(line.substring(start, i).trim());
            start = i + 1;
        }
    }
    result.push(line.substring(start).trim());
    return result;
}

/**
 * JSON Extractor from AI Text
 */
function extractJSON(text: string): any {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * PDF Parsing for Settlement (GrabFood/GoFood)
 */
export async function parseSettlementPDFAction(brandId: string, formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'File wajib diunggah.' };

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[Settlement] PDF Parsing: File=${file.name}, Size=${file.size}, Buffer=${buffer.length}`);

        if (!buffer || buffer.length === 0) {
            throw new Error("File PDF kosong atau gagal dibaca.");
        }

        // Bypass the problematic index.js debug logic which causes ENOENT errors in some environments
        const pdf = require('pdf-parse/lib/pdf-parse.js');

        if (typeof pdf !== 'function') {
            throw new Error(`pdf-parse import failed. Type: ${typeof pdf}`);
        }

        const data = await pdf(buffer);
        const rawText = data.text;

        // Use the existing AI Parsing logic, but with PDF text content
        // This is robust because we use the same prompt "Settlement Parsing"
        const result = await parseSettlementEmailAction(brandId, rawText);

        // If AI detects it's GrabFood (or other), it will label accordingly.
        return result;

    } catch (error: any) {
        console.error('[Settlement] PDF Parsing failed:', error);
        return { success: false, error: error.message };
    }
}

export async function executeSettlementReconciliationAction(
    brandId: string,
    settlementData: any,
    destinationAccountId: string = '1-1101' // Default Bank Mandiri
) {
    try {
        // 0. Ensure COA exists
        const destAccount = await getAccountByCode(brandId, destinationAccountId);
        if (!destAccount) {
            console.log(`Destination account ${destinationAccountId} not found for brand ${brandId}. Initializing COA...`);
            await initializeChartOfAccounts(brandId);
        }

        const results = [];

        for (const order of settlementData.orders) {
            try {
                // 1. Find the internal order
                if (!order.externalOrderId) {
                    throw new Error("Order ID missing in settlement data.");
                }

                let internalOrder = await prisma.order.findFirst({
                    where: {
                        brandId,
                        OR: [
                            { externalOrderId: order.externalOrderId },
                            { invoiceNo: order.externalOrderId }
                        ]
                    }
                });

                if (!internalOrder) {
                    // 1b. Auto-Create Skeleton Order if missing
                    const generatedInvoice = `INV-AUTO-${order.externalOrderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;

                    internalOrder = await prisma.order.create({
                        data: {
                            brandId,
                            brand: { connect: { id: brandId } },
                            invoiceNo: generatedInvoice,
                            externalOrderId: order.externalOrderId,
                            customerName: 'Shopee Customer (Auto)',
                            channel: 'SHOPEE',
                            status: 'SELESAI', // Auto-completed
                            quantity: 1,
                            total: order.grossAmount,
                            subtotal: order.grossAmount,
                            internalNotes: `[AUTO_GENERATED] Created via Settlement Parser. Waiting for manual item details.`,
                            createdAt: new Date()
                        }
                    });
                }

                if (internalOrder) {
                    // 1c. Verify Price Matching
                    const manualTotal = Number(internalOrder.total);
                    const settlementTotal = Number(order.grossAmount);
                    const diff = Math.abs(manualTotal - settlementTotal);
                    const tolerance = 500; // Rp 500 tolerance for rounding

                    let matchNote = '';
                    if (diff > tolerance) {
                        matchNote = ` [MISMATCH: Order Rp${manualTotal} vs Settlement Rp${settlementTotal}]`;
                        console.warn(`Price mismatch for ${order.externalOrderId}: Order=${manualTotal}, Settlement=${settlementTotal}`);
                    }

                    // 2. recordPayment with Deductions
                    const fees = order.fees || 0;
                    const details = order.feeDetails || {};

                    const deductions = [];
                    // Add individual fee components if they exist
                    if (details.commission > 0) deductions.push({ amount: details.commission, accountCode: '5-6000', description: 'Shopee Commission' });
                    if (details.serviceFee > 0) deductions.push({ amount: details.serviceFee, accountCode: '5-6000', description: 'Shopee Service Fee' });
                    if (details.transactionFee > 0) deductions.push({ amount: details.transactionFee, accountCode: '5-6000', description: 'Shopee Transaction Fee' });
                    if (details.voucherSubsidy > 0) deductions.push({ amount: details.voucherSubsidy, accountCode: '5-6000', description: 'Merchant Voucher Subsidy' });
                    if (details.directDiscount > 0) deductions.push({ amount: details.directDiscount, accountCode: '5-6000', description: 'Food Direct Discount' });
                    if (details.pb1 > 0) deductions.push({ amount: details.pb1, accountCode: '5-6000', description: 'PB1 Tax' });
                    if (details.shippingSubsidy > 0) deductions.push({ amount: details.shippingSubsidy, accountCode: '5-6000', description: 'Shipping Subsidy' });

                    // Fallback: if details empty but fees > 0 (legacy or total deduction used)
                    if (deductions.length === 0 && fees > 0) {
                        deductions.push({ amount: fees, accountCode: '5-6000', description: 'Marketplace Fees' });
                    }

                    await JournalService.recordPayment(
                        brandId,
                        internalOrder.id,
                        order.netAmount,
                        'TRANSFER',
                        destinationAccountId,
                        deductions
                    );

                    // Update order internal notes to record reconciliation
                    const breakdown = [];
                    if (details.commission > 0) breakdown.push(`Komisi: ${details.commission}`);
                    if (details.serviceFee > 0) breakdown.push(`Layanan: ${details.serviceFee}`);
                    if (details.transactionFee > 0) breakdown.push(`Transaksi: ${details.transactionFee}`);
                    if (details.voucherSubsidy > 0) breakdown.push(`Voucher Makanan: ${details.voucherSubsidy}`);
                    if (details.directDiscount > 0) breakdown.push(`Diskon Makanan: ${details.directDiscount}`);
                    if (details.pb1 > 0) breakdown.push(`PB1: ${details.pb1}`);
                    if (details.shippingSubsidy > 0) breakdown.push(`Subsidi Ongkir: ${details.shippingSubsidy}`);

                    const feeStr = breakdown.length > 0 ? `Fees: ${fees} (${breakdown.join(', ')})` : `Fees: ${fees}`;

                    await prisma.order.update({
                        where: { id: internalOrder.id },
                        data: {
                            internalNotes: `${internalOrder.internalNotes || ''}\n[FINANCE] Reconciled via AI Settlement Parser on ${new Date().toLocaleDateString('id-ID')}. Net: ${order.netAmount}, ${feeStr}`
                        }
                    });

                    results.push({ externalOrderId: order.externalOrderId, orderId: internalOrder.id, success: true, warning: matchNote });
                }
            } catch (err: any) {
                console.error(`[Settlement] Failed to process order ${order.externalOrderId}:`, err);
                results.push({ externalOrderId: order.externalOrderId, success: false, reason: err.message });
            }
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, results };
    } catch (error: any) {
        console.error('[Settlement] Execution failed:', error);
        return { success: false, error: error.message };
    }
}
