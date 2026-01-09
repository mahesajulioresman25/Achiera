'use server';

import { prisma } from '@/lib/prisma';
import { waEngine } from '@/lib/whatsapp/engine';

/**
 * Generates and sends a daily performance digest for a brand via WhatsApp.
 */
export async function sendDailyDigestAction(brandId: string, phone?: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            include: {
                orders: {
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    include: { orderItems: true }
                }
            }
        });

        if (!brand) throw new Error('Brand not found');

        const targetPhone = phone || process.env.WA_ADMIN_PHONE || '6282215191435';

        // Calculate Statistics
        const totalSales = brand.orders.reduce((sum, o) => sum + Number(o.total), 0);
        const orderCount = brand.orders.length;

        // Top Products
        const productStats: Record<string, number> = {};
        brand.orders.forEach(o => {
            o.orderItems.forEach(item => {
                productStats[item.name] = (productStats[item.name] || 0) + item.quantity;
            });
        });

        const topProducts = Object.entries(productStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, qty]) => `- ${name}: ${qty} pcs`)
            .join('\n');

        // Low Stock Items
        const lowStockItems = await prisma.frozenVariant.findMany({
            where: {
                product: { category: { brandId } },
                stockOnHand: { lt: 10 }
            },
            include: { product: true },
            take: 5
        });

        const lowStockMsg = lowStockItems.length > 0
            ? lowStockItems.map(i => `- ${i.product.name} (${i.stockOnHand} sisa)`).join('\n')
            : '✅ Semua stok aman.';

        const dateStr = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const reportMsg = `📊 *RINGKASAN HARIAN: ${brand.name.toUpperCase()}* 📊\n_(${dateStr})_\n\n` +
            `💰 *Penjualan:* Rp${totalSales.toLocaleString('id-ID')}\n` +
            `📦 *Total Pesanan:* ${orderCount}\n\n` +
            `🔥 *Produk Terlaris:*\n${topProducts || '- Belum ada data'}\n\n` +
            `🚨 *Status Stok Menipis:*\n${lowStockMsg}\n\n` +
            `--- Akhir Laporan ---`;

        await waEngine.sendMessage(targetPhone, reportMsg);

        return { success: true, message: 'Laporan harian telah terkirim ke WhatsApp Admin.' };
    } catch (error: any) {
        console.error('Failed to send daily digest:', error);
        return { success: false, error: error.message };
    }
}
