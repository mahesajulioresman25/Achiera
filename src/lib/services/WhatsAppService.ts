
// src/lib/services/WhatsAppService.ts

import { prisma } from '@/lib/prisma';

export class WhatsAppService {

    /**
     * Entry point for sending order creation notice.
     * High priority (2) as it's transactional but not as critical as OTP.
     */
    static async sendOrderCreated(order: any, loyaltyInfo?: { pointsEarned: number; currentBalance: number }) {
        if (process.env.HAS_WHATSAPP === 'false') {
            console.log('[WhatsAppService] SKIPPING: WhatsApp is disabled');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        let message = `Halo Bunda ${order.customerName}! 🥰\n\nTerima kasih sudah jajan di Rasa Ibu. Pesanan Bunda sudah kami terima dan segera disiapkan.\n\nInvoice: *${order.invoiceNo}*\nTotal: *Rp ${order.total.toLocaleString()}*\n`;

        if (loyaltyInfo) {
            message += `\n✨ *Selamat Bunda!* Bunda dapat *${loyaltyInfo.pointsEarned} Poin* dari pesanan ini.\nTotal Poin Bunda sekarang: *${loyaltyInfo.currentBalance} Poin*. Jangan lupa kumpulkan terus untuk hadiah menarik berikutnya ya! 🎁\n`;
        }

        message += `\nBunda bisa lacak statusnya di sini:\n${trackingUrl}\n\nSehat selalu Bunda! 🙏🥘`;

        return this.addToQueue({
            brandId: order.brandId,
            phone: order.customerPhone,
            text: message,
            priority: 2,
            metadata: { type: 'order_created', invoice: order.invoiceNo }
        });
    }

    /**
     * Send status update to customer.
     * Priority 3 (Standard Transactional).
     */
    static async sendStatusUpdate(order: any, newStatus: string) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        const message = `Halo Bunda ${order.customerName}! 🚀\n\nAda update nih untuk pesanan Bunda dengan Invoice: *${order.invoiceNo}*.\n\nStatus Bunda sekarang: *${newStatus}*\n\nBunda bisa cek detail pergerakannya di sini:\n${trackingUrl}\n\nMohon ditunggu ya Bunda! 🥰`;

        return this.addToQueue({
            brandId: order.brandId,
            phone: order.customerPhone,
            text: message,
            priority: 3,
            metadata: { type: 'status_update', invoice: order.invoiceNo }
        });
    }

    /**
     * Notify admin when payment proof is uploaded.
     * Priority 2 (Admin Alert).
     */
    static async notifyAdminPaymentUploaded(order: any) {
        const message = `🚨 *NOTIFIKASI ADMIN* 🚨\n\nAda bukti bayar baru yang diunggah untuk Invoice: *${order.invoiceNo}* oleh *${order.customerName}*.\n\nMohon segera divalidasi di dashboard Admin.`;

        return this.addToQueue({
            brandId: order.brandId,
            phone: process.env.WHATSAPP_ADMIN_PHONE || '', // Use env for admin phone
            text: message,
            priority: 1, // High priority for admin alerts
            metadata: { type: 'admin_alert', invoice: order.invoiceNo }
        });
    }

    /**
     * Core method to push message into database queue.
     * The Background Processor will pick this up and send with throttle.
     */
    private static async addToQueue(data: { brandId: string; phone: string; text: string; priority?: number; metadata?: any }) {
        if (process.env.HAS_WHATSAPP === 'false') return false;
        if (!data.phone || data.phone === '-' || data.phone === '') return false;

        try {
            await (prisma as any).whatsAppQueue.create({
                data: {
                    brandId: data.brandId,
                    phone: data.phone,
                    text: data.text,
                    priority: data.priority || 3,
                    metadata: data.metadata || {},
                    status: 'PENDING'
                }
            });
            console.log(`[WhatsAppService] Message queued for ${data.phone} (Pri: ${data.priority})`);
            return true;
        } catch (error) {
            console.error('[WhatsAppService] Queue Error:', error);
            return false;
        }
    }
}
