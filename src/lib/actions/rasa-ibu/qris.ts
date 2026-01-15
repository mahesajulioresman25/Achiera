'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessageAction } from './whatsapp';

/**
 * Upload QRIS Image for Settings
 */
export async function uploadQRISImageAction(brandId: string, formData: FormData) {
    try {
        const file = formData.get('image') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.'
            };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path for QRIS images in Supabase: qris/
        const ext = file.name.split('.').pop() || 'png';
        const filename = `qris/${brandId}-${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('[QRIS_UPLOAD_ERROR_SUPABASE]', uploadError);
            return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl: imageUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        // Update Brand Settings
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const currentSettings = (brand?.paymentSettings as any) || {};
        const updatedSettings = {
            ...currentSettings,
            qrisImageUrl: imageUrl,
            qrisEnabled: true,
            qrisUploadedAt: new Date().toISOString()
        };

        await prisma.brand.update({
            where: { id: brandId },
            data: { paymentSettings: updatedSettings }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, url: imageUrl };
    } catch (error: any) {
        console.error('[QRIS_UPLOAD_ERROR]', error);
        return { success: false, error: error.message || 'Failed to upload QRIS image' };
    }
}

/**
 * Toggle QRIS payment method on/off
 */
export async function toggleQRISAction(brandId: string, enabled: boolean) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const currentSettings = (brand?.paymentSettings as any) || {};
        const updatedSettings = {
            ...currentSettings,
            qrisEnabled: enabled
        };

        await prisma.brand.update({
            where: { id: brandId },
            data: { paymentSettings: updatedSettings }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Upload Payment Proof from Customer
 */
export async function uploadPaymentProofAction(orderId: string, formData: FormData) {
    try {
        const file = formData.get('image') as File;
        if (!file) throw new Error('No image provided');

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = file.name.split('.').pop() || 'png';
        const filename = `payment-proofs/${orderId}-${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('[PROOF_UPLOAD_ERROR_SUPABASE]', uploadError);
            return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl: proofPath } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        // Create or Update Payment record
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new Error('Order not found');

        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: order.total,
                type: 'QRIS',
                proofPath: proofPath,
                isVerified: false
            }
        });

        // Update order status to waiting verification
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'MENUNGGU_VERIFIKASI_QRIS'
            }
        });

        // Log status change
        await (prisma as any).orderStatusLog.create({
            data: {
                orderId,
                status: 'MENUNGGU_VERIFIKASI_QRIS',
                message: 'Customer mengunggah bukti pembayaran QRIS'
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        console.error('[PROOF_UPLOAD_ERROR]', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify Payment (Staff Action)
 */
export async function verifyPaymentAction(paymentId: string, verifiedBy: string) {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true }
        });

        if (!payment) throw new Error('Payment not found');

        // Update Payment
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                isVerified: true,
                verifiedBy,
                verifiedAt: new Date()
            }
        });

        // Update Order
        await prisma.order.update({
            where: {
                id: payment.orderId,
                brandId: (payment.order as any).brandId
            },
            data: {
                status: 'DIBAYAR'
            }
        });

        // Log status change
        await (prisma as any).orderStatusLog.create({
            data: {
                brandId: (payment.order as any).brandId,
                orderId: payment.orderId,
                status: 'DIBAYAR',
                message: `Pembayaran QRIS diverifikasi oleh ${verifiedBy}`
            }
        });

        // WhatsApp Notification
        if ((payment.order as any)?.customerPhone) {
            try {
                const message = `Halo Kak ${payment.order.customerName},\n\nPembayaran QRIS Kakak untuk pesanan *#${payment.order.invoiceNo || payment.order.id.slice(-8).toUpperCase()}* telah *BERHASIL* diverifikasi.\n\nTotal: Rp ${Number(payment.amount).toLocaleString('id-ID')}\n\nPesanan Kakak sekarang sedang kami siapkan. Terima kasih! 🙏`;
                await sendWhatsAppMessageAction((payment.order as any).customerPhone, message);
            } catch (waError) {
                console.error('[QRIS] WhatsApp notification failed:', waError);
            }
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Reject Payment (Staff Action)
 */
export async function rejectPaymentAction(paymentId: string, reason: string) {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true }
        });

        if (!payment) throw new Error('Payment not found');

        // Update Order back to DIPESAN
        await prisma.order.update({
            where: {
                id: payment.orderId,
                brandId: (payment.order as any).brandId
            },
            data: {
                status: 'DIPESAN',
                internalNotes: payment.order.internalNotes
                    ? `${payment.order.internalNotes}\n[REJECTED PAYMENT]: ${reason}`
                    : `[REJECTED PAYMENT]: ${reason}`
            }
        });

        // Log rejection
        await (prisma as any).orderStatusLog.create({
            data: {
                brandId: (payment.order as any).brandId,
                orderId: payment.orderId,
                status: 'CANCELLED',
                message: `Pembayaran QRIS ditolak: ${reason}`
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get QRIS Info for a Brand
 */
export async function getQRISInfoAction(brandId: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const settings = (brand?.paymentSettings as any) || {};
        return {
            success: true,
            qrisImageUrl: settings.qrisImageUrl,
            qrisEnabled: settings.qrisEnabled
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Pending QRIS Payments
 */
export async function getPendingPaymentsAction(brandId: string, invoiceNo?: string) {
    try {
        const query: any = {
            order: { brandId },
            isVerified: false,
            proofPath: { not: null }
        };

        if (invoiceNo) {
            query.order.invoiceNo = invoiceNo;
        }

        const payments = await prisma.payment.findMany({
            where: query,
            include: {
                order: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data: JSON.parse(JSON.stringify(payments)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllPaymentProofsAction(brandId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: {
                order: { brandId },
                proofPath: { not: null }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        customerName: true,
                        totalAmount: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also fetch from paymentReconciliation which uses bank transfers
        const bankPayments = await prisma.paymentReconciliation.findMany({
            where: {
                order: { brandId },
                paymentProof: { not: null }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        customerName: true,
                        totalAmount: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Merge and normalize
        const normalizedPayments = [
            ...payments.map(p => ({
                id: p.id,
                orderId: p.orderId,
                invoiceNo: p.order.invoiceNo,
                customerName: p.order.customerName,
                amount: Number(p.order.totalAmount),
                proof: p.proofPath,
                method: 'QRIS',
                isVerified: p.isVerified,
                createdAt: p.createdAt,
                type: 'QRIS'
            })),
            ...bankPayments.map(bp => ({
                id: bp.id,
                orderId: bp.orderId,
                invoiceNo: bp.order.invoiceNo,
                customerName: bp.order.customerName,
                amount: Number(bp.amount),
                proof: bp.paymentProof,
                method: bp.paymentMethod || 'Bank Transfer',
                isVerified: bp.isVerified,
                createdAt: bp.createdAt,
                type: 'BANK_TRANSFER'
            }))
        ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: JSON.parse(JSON.stringify(normalizedPayments)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
