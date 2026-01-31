
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

        // Fetch brand name if not provided
        let brandName = 'Kami';
        try {
            const brand = await prisma.brand.findUnique({
                where: { id: order.brandId },
                select: { name: true }
            });
            if (brand) brandName = brand.name;
        } catch (e) {
            console.warn('[WhatsAppService] Failed to fetch brand name:', e);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        let message = `Halo Kak ${order.customerName}! 🥰\n\nTerima kasih sudah jajan di *${brandName}*. Pesanan Kakak sudah kami terima dan segera disiapkan.\n\nInvoice: *${order.invoiceNo}*\nTotal: *Rp ${order.total.toLocaleString()}*\n`;

        if (loyaltyInfo) {
            message += `\n✨ *Selamat!* Kakak dapat *${loyaltyInfo.pointsEarned} Poin* dari pesanan ini.\nTotal Poin Kakak sekarang: *${loyaltyInfo.currentBalance} Poin*. Jangan lupa kumpulkan terus untuk hadiah menarik berikutnya ya! 🎁\n`;
        }

        message += `\nLacak status pesanan di sini:\n${trackingUrl}\n\nTerima kasih! 🙏`;

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
        if (process.env.HAS_WHATSAPP === 'false') return false;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        const message = `Halo Kak ${order.customerName}! 🚀\n\nAda update nih untuk pesanan Kakak dengan Invoice: *${order.invoiceNo}*.\n\nStatus Pesanan: *${newStatus}*\n\nCek detail pergerakannya di sini:\n${trackingUrl}\n\nMohon ditunggu ya! 🥰`;

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
        if (process.env.HAS_WHATSAPP === 'false') return false;

        // Fetch brand name
        let brandName = 'Platform';
        try {
            const brand = await prisma.brand.findUnique({
                where: { id: order.brandId },
                select: { name: true }
            });
            if (brand) brandName = brand.name;
        } catch (e) { }

        const message = `🚨 *NOTIFIKASI ADMIN [${brandName}]* 🚨\n\nAda bukti bayar baru yang diunggah untuk Invoice: *${order.invoiceNo}* oleh *${order.customerName}*.\n\nMohon segera divalidasi di dashboard Admin.`;

        return this.addToQueue({
            brandId: order.brandId,
            phone: process.env.WHATSAPP_ADMIN_PHONE || '',
            text: message,
            priority: 1,
            metadata: { type: 'admin_payment_proof', invoice: order.invoiceNo }
        });
    }

    /**
     * Notify admin when stock is low.
     */
    static async notifyLowStock(brandId: string, variant: any) {
        if (process.env.HAS_WHATSAPP === 'false') return false;

        const message = `⚠️ *STOK MENIPIS* ⚠️\n\nProduk: *${variant.product?.name || variant.name}*\nVarian: *${variant.name}*\nSisa Stok: *${variant.stockOnHand}*\n\nSegera lakukan restock!`;

        return this.addToQueue({
            brandId,
            phone: process.env.WHATSAPP_ADMIN_PHONE || '',
            text: message,
            priority: 2,
            metadata: { type: 'low_stock_alert', variantId: variant.id }
        });
    }

    /**
     * Send cancellation notice to customer.
     */
    static async sendOrderCancelled(order: any, reason: string) {
        if (process.env.HAS_WHATSAPP === 'false') return false;

        const message = `Halo Kak ${order.customerName}! 🙏\n\nKami informasikan bahwa pesanan Kakak dengan Invoice: *${order.invoiceNo}* telah *DIBATALKAN*.\n\nAlasan: ${reason}\n\nJika ini adalah kesalahan atau Kakak memerlukan bantuan, silakan hubungi kami. Terima kasih.`;

        return this.addToQueue({
            brandId: order.brandId,
            phone: order.customerPhone,
            text: message,
            priority: 2,
            metadata: { type: 'order_cancelled', invoice: order.invoiceNo }
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
