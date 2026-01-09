'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { sendWhatsAppMessageAction } from './whatsapp';
import { existsSync } from 'fs';

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

        // Path for QRIS images: public/uploads/qris/
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'qris');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Use custom name with brandId and timestamp to avoid conflicts but keep it clean
        const ext = extname(file.name) || '.png';
        const filename = `${brandId}-${Date.now()}${ext}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        const imageUrl = `/uploads/qris/${filename}`;

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

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const ext = extname(file.name) || '.png';
        const filename = `${orderId}-${Date.now()}${ext}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        const proofPath = `/uploads/payment-proofs/${filename}`;

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
            where: { id: payment.orderId },
            data: {
                status: 'DIBAYAR'
            }
        });

        // Log status change
        await (prisma as any).orderStatusLog.create({
            data: {
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
            where: { id: payment.orderId },
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
export async function getPendingPaymentsAction(brandId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: {
                order: { brandId },
                type: 'QRIS',
                isVerified: false,
                proofPath: { not: null }
            },
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
