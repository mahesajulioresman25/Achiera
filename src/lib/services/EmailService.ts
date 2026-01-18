import nodemailer from 'nodemailer';
import path from 'path';

export interface EmailOrderInfo {
    invoiceNo: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status?: string;
    items?: any[];
    brandId?: string;
    paymentMethod?: 'WHATSAPP' | 'QRIS' | string;
    isGift?: boolean;
    giftMessage?: string;
    recipientName?: string;
    recipientEmail?: string;
}

export interface LoyaltyInfo {
    pointsEarned: number;
    currentBalance: number;
}

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    private static getFromAddress() {
        let fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'order@achiera.com';

        // Extract email only if it's in "Name <email>" format
        if (fromEmail.includes('<') && fromEmail.includes('>')) {
            const matches = fromEmail.match(/<([^>]+)>/);
            if (matches && matches[1]) {
                fromEmail = matches[1];
            }
        }

        return {
            name: "RASA IBU",
            address: fromEmail.trim()
        };
    }

    static async sendOrderConfirmation(order: EmailOrderInfo, loyalty?: LoyaltyInfo) {
        // Always send Order Confirmation (Invoice) to the CUSTOMER (Buyer)
        const recipientEmail = order.customerEmail;

        if (!recipientEmail) {
            console.warn('[EmailService] Skipping: No customer email provided');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        // Default bank info, can be overridden by brand settings
        let bankInfo = { bankName: 'BCA', accountNo: '2330620385', accountName: 'Mahesa Julio Resman' };
        let qrisUrl: string | undefined = undefined;

        // Fetch bank info from database
        try {
            const { prisma } = await import('@/lib/prisma');

            // Priority 1: Get active bank account for this brand
            const brandBank = await prisma.bankAccount.findFirst({
                where: { brandId: order.brandId || undefined, isActive: true },
                orderBy: { createdAt: 'desc' }
            });

            if (brandBank) {
                bankInfo = {
                    bankName: brandBank.bankName,
                    accountNo: brandBank.accountNumber,
                    accountName: brandBank.accountHolder
                };
            }

            // Fetch brand settings specifically for QRIS and other details
            if (order.brandId) {
                const brand = await prisma.brand.findUnique({
                    where: { id: order.brandId },
                    select: { paymentSettings: true }
                });
                const settings = brand?.paymentSettings as any;
                if (settings) {
                    // QRIS takes precedence for visualization if it's a QRIS payment
                    qrisUrl = settings.qrisImageUrl;
                }
            }
        } catch (error) {
            console.error(`[EmailService] Failed to fetch bank/brand settings:`, error);
        }

        try {
            const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 20px 40px rgba(45,58,45,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 60px 40px; text-align: center; position: relative; overflow: hidden; }
        .header-pattern { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.05; background-image: radial-gradient(#FDFBF7 1px, transparent 1px); background-size: 20px 20px; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 40px; text-align: center; color: #8B7E66; font-size: 12px; border-top: 1px solid #E5E1D8; }
        h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.2; }
        .invoice-box { background: #FDFBF7; padding: 32px; border-radius: 24px; margin: 24px 0; border: 1px solid #E5E1D8; position: relative; }
        .loyalty-card { background: linear-gradient(135deg, #2D3A2D 0%, #4A5D4A 100%); color: white; padding: 24px; border-radius: 24px; margin: 24px 0; text-align: center; box-shadow: 0 10px 20px rgba(45,58,45,0.1); }
        .button { display: inline-block; padding: 18px 36px; background: #2D3A2D; color: #FDFBF7 !important; text-decoration: none; border-radius: 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 24px; transition: all 0.3s ease; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; display: block; margin-bottom: 12px; }
        
        .receipt-table { width: 100%; border-collapse: collapse; margin: 32px 0; font-size: 14px; }
        .receipt-table th { text-align: left; border-bottom: 2px solid #F3F1ED; padding: 12px; color: #8B7E66; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
        .receipt-table td { padding: 16px 12px; border-bottom: 1px solid #F3F1ED; vertical-align: middle; }
        
        .payment-status { display: inline-block; padding: 6px 12px; border-radius: 100px; font-size: 10px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 8px; }
        .status-waiting { background: #FFF9E6; color: #856404; }
        .status-paid { background: #ECFDF5; color: #065F46; }

        .payment-box { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 24px; padding: 32px; margin: 32px 0; }
        .payment-title { font-weight: 900; color: #856404; font-size: 15px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em; display: flex; items-center; gap: 8px; }
        .bank-info { background: white; padding: 24px; border-radius: 20px; margin-top: 16px; border: 1px solid rgba(133, 100, 4, 0.1); }
        
        .social-links { margin-top: 20px; }
        .social-links a { margin: 0 10px; color: #2D3A2D; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-pattern"></div>
            <img src="${appUrl}/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" style="height: 70px; margin-bottom: 24px; position: relative;">
            <span class="accent" style="color: #B2BCA2;">Achiera Rasa Ibu</span>
            <h1>${order.isGift ? 'Kejutan Spesial Siap Dikirim! 🎁' : 'Dapur Kami Sudah Menerima Pesanan Bunda! 🥘'}</h1>
        </div>
        <div class="content">
            <p style="font-size: 18px; margin-top: 0;">Halo, <strong>Bunda ${order.customerName}</strong>!</p>
            <p style="color: #4A5D4A; font-size: 15px; margin-bottom: 32px;">
                ${order.isGift
                    ? `Terima kasih sudah memilih Rasa Ibu untuk kejutan spesial kepada <strong>${order.recipientName || 'kerabat tercinta'}</strong>. Kami akan menyiapkannya dengan penuh kasih sayang.`
                    : 'Terima kasih banyak sudah mempercayakan hidangan keluarga kepada Dapur Rasa Ibu. Pesanan Bunda sedang kami catat dan segera disiapkan.'
                }
            </p>
            
            <div class="invoice-box">
                <table width="100%">
                    <tr>
                        <td style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7E66;">Invoice ID</td>
                        <td align="right" style="font-family: monospace; font-size: 14px; font-weight: bold; color: #2D3A2D;">${order.invoiceNo}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 12px 0;"><div style="border-top: 1px solid #E5E1D8;"></div></td>
                    </tr>
                    <tr>
                        <td style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7E66;">Total Pembayaran</td>
                        <td align="right" style="font-size: 24px; font-weight: 900; color: #2D3A2D;">Rp ${order.total.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <!-- Gift Message Section -->
            ${order.isGift ? `
            <div style="margin: 32px 0; background: #FDFBF7; border: 1px dashed #D1CBBF; border-radius: 24px; padding: 32px; text-align: center;">
                <span class="accent" style="margin-bottom: 20px;">Kartu Ucapan Bunda</span>
                <div style="font-size: 16px; font-style: italic; color: #2D3A2D; line-height: 1.8; font-family: 'Georgia', serif; padding: 0 20px;">
                    "${order.giftMessage || 'Selamat menikmati hidangan spesial ini!'}"
                </div>
            </div>
            ` : ''}

            <h3 style="font-size: 18px; font-weight: 900; margin-top: 40px; margin-bottom: 16px;">🧾 Rincian Pesanan</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Hidangan</th>
                        <th style="text-align: center;">Porsi</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${((order.items || (order as any).orderItems) || []).map((item: any) => `
                        <tr>
                            <td>
                                <strong style="display: block; font-size: 15px; color: #2D3A2D;">${item.name}</strong>
                                <span style="font-size: 12px; color: #8B7E66; font-weight: 500;">${item.variantName || 'Normal'}</span>
                            </td>
                            <td align="center" style="font-weight: 700;">${item.quantity}</td>
                            <td align="right" style="font-weight: 700;">Rp ${Number(item.subtotal || (item.price * item.quantity)).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="2" align="right" style="font-weight: 900; padding: 24px 12px 0 0; font-size: 16px; color: #8B7E66;">TOTAL AKHIR</td>
                        <td align="right" style="font-weight: 900; padding: 24px 0 0 0; font-size: 20px; color: #2D3A2D;">Rp ${order.total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Payment Instructions -->
            ${['WAITING_PAYMENT', 'DIPESAN'].includes(order.status || '') ? `
            <div class="payment-box">
                <div class="payment-title">
                    <span style="font-size: 20px;">💳</span> Penyelesaian Pembayaran
                </div>
                
                ${order.paymentMethod === 'QRIS' && qrisUrl ? `
                    <p style="margin: 0; font-size: 14px; color: #856404;">Silakan scan kode QRIS berikut untuk pembayaran instan:</p>
                    <div style="text-align: center; margin-top: 24px; background: white; padding: 32px; border-radius: 24px; border: 1px solid rgba(133, 100, 4, 0.1);">
                        <img src="${qrisUrl}" alt="QRIS" style="max-width: 220px; height: auto;" />
                        <p style="font-size: 11px; color: #8B7E66; margin-top: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Dukung Semua Bank & E-Wallet</p>
                    </div>
                ` : `
                    <p style="margin: 0; font-size: 14px; color: #856404;">Silakan transfer sesuai detail di bawah ini agar pesanan Bunda segera kami antar:</p>
                    <div class="bank-info">
                        <table width="100%">
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase;">Nama Bank</td>
                                <td align="right" style="font-weight: 800; color: #2D3A2D;">${bankInfo.bankName}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase; padding: 12px 0;">No. Rekening</td>
                                <td align="right" style="font-weight: 900; font-size: 20px; color: #2D3A2D; padding: 12px 0; letter-spacing: 1px;">${bankInfo.accountNo}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase;">Atas Nama</td>
                                <td align="right" style="font-weight: 800; color: #2D3A2D;">${bankInfo.accountName}</td>
                            </tr>
                        </table>
                    </div>
                `}
                
                <div style="margin-top: 24px; font-size: 13px; color: #856404; line-height: 1.6; background: rgba(255, 255, 255, 0.5); padding: 16px; border-radius: 16px;">
                    <strong>⚠️ Catatan Penting:</strong><br/>
                    Bunda, setelah transfer mohon klik tombol di bawah untuk <strong>unggah bukti bayar</strong> agar tim kami bisa langsung verifikasi tanpa perlu menunggu lama.
                </div>
            </div>
            ` : ''}

            ${loyalty && !order.isGift ? `
            <div class="loyalty-card">
                <span style="font-size: 24px; display: block; margin-bottom: 8px;">✨</span>
                <p style="margin: 0; font-size: 16px; font-weight: 700;">Selamat Bunda! Poin Bertambah.</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Bunda mendapatkan <strong>${loyalty.pointsEarned} Poin</strong>. Total sekarang: <strong>${loyalty.currentBalance} Poin</strong>.</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 14px; color: #8B7E66; margin-bottom: 8px;">Lihat rincian perjalanan hidangan Bunda:</p>
                <a href="${trackingUrl}" class="button">Lacak Perjalanan Hidangan</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Dapur Rasa Ibu - Oleh Achiera</strong></p>
            <p style="margin-top: 8px; line-height: 1.8;">
                Komitmen kami adalah menghadirkan kehangatan masakan rumah<br/>
                ke meja makan Bunda setiap harinya.
            </p>
            <div class="social-links">
                <p>© 2026 Achiera Platform. Semua Hak Dilindungi.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `.trim();

            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: recipientEmail,
                subject: order.isGift
                    ? `[Rasa Ibu] Kejutan Hidangan Untuk Bunda! 🎁 #${order.invoiceNo}`
                    : `[Rasa Ibu] Kami Sudah Menerima Pesanan Bunda! 🥘 #${order.invoiceNo}`,
                html: html
            });
            console.log(`[EmailService] Order confirmation sent to ${recipientEmail}${order.isGift ? ' (gift recipient)' : ''}`);

            // System Log
            const { logSystemActivity } = await import('@/lib/logger');
            await logSystemActivity(
                'EMAIL_SEND',
                'INFO',
                `Order confirmation sent to ${recipientEmail}`,
                { invoiceNo: order.invoiceNo, recipientEmail, isGift: order.isGift },
                order.brandId
            );

            return true;
        } catch (error) {
            console.error('[EmailService] Send Error:', error);

            // System Log Error
            try {
                const { logSystemActivity } = await import('@/lib/logger');
                await logSystemActivity(
                    'EMAIL_SEND',
                    'ERROR',
                    `Failed to send order confirmation to ${recipientEmail}`,
                    { invoiceNo: order.invoiceNo, error: String(error) },
                    order.brandId
                );
            } catch (e) { /* ignore log error */ }

            return false;
        }
    }

    static async sendGiftNotification(order: EmailOrderInfo) {
        const recipientEmail = order.recipientEmail;
        if (!recipientEmail) {
            console.warn('[EmailService] Skipping Gift Notification: No recipient email provided');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 20px 40px rgba(45,58,45,0.05); }
        .header { background: #DB2777; color: #FDFBF7; padding: 60px 40px; text-align: center; position: relative; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 40px; text-align: center; color: #8B7E66; font-size: 12px; border-top: 1px solid #E5E1D8; }
        h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; }
        .card-box { background: #FFF1F2; padding: 40px; border-radius: 24px; margin: 32px 0; border: 2px dashed #FECDD3; text-align: center; position: relative; }
        .button { display: inline-block; padding: 18px 36px; background: #DB2777; color: #FDFBF7 !important; text-decoration: none; border-radius: 20px; font-weight: 900; margin-top: 24px; }
        .accent { color: #FECDD3; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; display: block; margin-bottom: 12px; }
        
        .item-table { width: 100%; border-collapse: collapse; margin: 32px 0; font-size: 15px; }
        .item-table th { text-align: left; border-bottom: 2px solid #F3F1ED; padding: 12px; color: #8B7E66; font-weight: 900; text-transform: uppercase; font-size: 10px; }
        .item-table td { padding: 16px 12px; border-bottom: 1px solid #F3F1ED; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${appUrl}/images/logos/rasa-ibu-logo-white.png" alt="Rasa Ibu" style="height: 60px; margin-bottom: 24px; opacity: 0.9;">
            <span class="accent">Hantaran Spesial</span>
            <h1>Ada Kiriman Kasih Sayang! 🎁</h1>
        </div>
        <div class="content">
            <p style="font-size: 18px; margin-top: 0;">Halo, <strong>Sahabat ${order.recipientName || 'Tercinta'}</strong>!</p>
            <p style="color: #4A5D4A; font-size: 15px;">Seseorang yang sangat peduli kepadamu ingin berbagi kehangatan lewat hidangan spesial dari Dapur Rasa Ibu. Sebuah paket kejutan sedang menuju ke tempatmu!</p>
            
            <div class="card-box">
                <span style="font-size: 32px; display: block; margin-bottom: 16px;">💌</span>
                <p style="font-size: 11px; font-weight: 900; color: #BE185D; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 20px;">Pesan Hangat Untukmu:</p>
                <div style="font-size: 20px; font-style: italic; font-family: 'Georgia', serif; color: #831843; line-height: 1.8;">
                    "${order.giftMessage || 'Semoga hidangan ini menambah kebahagiaan harimu!'}"
                </div>
                <p style="margin-top: 24px; font-size: 15px; font-weight: 900; color: #9D174D;">— ${order.customerName}</p>
            </div>

            <h3 style="font-size: 18px; font-weight: 900; margin-top: 40px;">📦 Isi Paket Kebahagiaan:</h3>
            <table class="item-table">
                <thead>
                    <tr>
                        <th width="75%">Menu Pilihan</th>
                        <th width="25%" style="text-align: center;">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    ${((order.items || (order as any).orderItems) || []).map((item: any) => `
                        <tr>
                            <td>
                                <strong style="color: #2D3A2D;">${item.name}</strong><br/>
                                <span style="font-size: 12px; color: #8B7E66;">${item.variantName || 'Normal'}</span>
                            </td>
                            <td align="center"><strong>${item.quantity}</strong> porsi</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: center; margin-top: 48px;">
                <p style="font-size: 14px; color: #8B7E66;">Penasaran sudah sampai mana hantarannya?</p>
                <a href="${trackingUrl}" class="button">Lacak Kiriman Kasih</a>
            </div>
            
            <p style="margin-top: 40px; font-size: 13px; color: #8B7E66; text-align: center; font-style: italic;">
                "Berbagi rasa, menyambung kasih."<br/>
                Tim Rasa Ibu siap mengantarkan amanah ini dengan sepenuh hati.
            </p>
        </div>
        <div class="footer">
            <p><strong>Dapur Rasa Ibu - Hantaran Kasih Sayang</strong></p>
            <p style="margin-top: 8px;">© 2026 Achiera Platform. Semua Hak Dilindungi.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        try {
            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: recipientEmail,
                subject: `🎁 Surprise! Ada kiriman spesial dari ${order.customerName}`,
                html: html,
            });
            console.log(`[EmailService] Gift Notification sent to ${recipientEmail}`);

            // System log
            const { logSystemActivity } = await import('@/lib/logger');
            await logSystemActivity(
                'EMAIL_SEND',
                'INFO',
                `Gift notification sent to ${recipientEmail}`,
                { invoiceNo: order.invoiceNo, sender: order.customerName },
                order.brandId
            );

            return true;
        } catch (error) {
            console.error('[EmailService] Gift Notification Error:', error);
            return false;
        }
    }

    static async sendStatusUpdate(order: EmailOrderInfo, newStatus: string) {
        if (!order.customerEmail) {
            console.warn('[EmailService] Skipping Status Update: No customer email provided');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 20px 40px rgba(45,58,45,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 60px 40px; text-align: center; position: relative; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 40px; text-align: center; color: #8B7E66; font-size: 12px; border-top: 1px solid #E5E1D8; }
        h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; }
        .status-box { background: #FDFBF7; padding: 40px; border-radius: 24px; margin: 32px 0; text-align: center; border: 1px solid #E5E1D8; position: relative; }
        .status-badge { display: inline-block; padding: 10px 24px; background: #B2BCA2; color: #2D3A2D; border-radius: 100px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 16px; box-shadow: 0 4px 12px rgba(178,188,162,0.2); }
        .button { display: inline-block; padding: 18px 36px; background: #2D3A2D; color: #FDFBF7 !important; text-decoration: none; border-radius: 20px; font-weight: 900; margin-top: 24px; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; display: block; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${appUrl}/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" style="height: 70px; margin-bottom: 24px;">
            <span class="accent" style="color: #B2BCA2;">Achiera Rasa Ibu</span>
            <h1>Kabar Terbaru Hidangan Bunda! 🚀</h1>
        </div>
        <div class="content">
            <p style="font-size: 18px; margin-top: 0;">Halo, <strong>Bunda ${order.customerName}</strong>!</p>
            <p style="color: #4A5D4A; font-size: 15px;">Ada perkembangan menyenangkan untuk pesanan Bunda dengan nomor invoice <strong>${order.invoiceNo}</strong>. Tim kami sedang bekerja sepenuh hati untuk memastikannya sampai ke tangan Bunda dengan sempurna.</p>
            
            <div class="status-box">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">✨</span>
                <p style="margin: 0; font-size: 12px; font-weight: 900; color: #8B7E66; text-transform: uppercase; letter-spacing: 0.2em;">Status Perjalanan Saat Ini:</p>
                <div class="status-badge">${newStatus}</div>
            </div>

            <div style="text-align: center; margin-top: 32px;">
                <p style="font-size: 14px; color: #8B7E66; margin-bottom: 8px;">Penasaran detail pergerakannya? Klik di bawah ini:</p>
                <a href="${trackingUrl}" class="button">Lacak Hidangan Saya</a>
            </div>
            
            <p style="margin-top: 40px; font-size: 15px; color: #4A5D4A; text-align: center; font-style: italic;">
                "Sabar ya Bunda, kehangatan sedang dalam perjalanan. Terima kasih sudah setia bersama Rasa Ibu." 🙏✨
            </p>
        </div>
        <div class="footer">
            <p><strong>Dapur Utama Rasa Ibu - Oleh Achiera</strong></p>
            <p style="margin-top: 8px;">© 2026 Achiera Platform. Semua Hak Dilindungi.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        try {
            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: order.customerEmail,
                subject: `[Achiera] Update Pesanan #${order.invoiceNo}: ${newStatus}`,
                html: html,
            });
            console.log(`[EmailService] Status update sent to ${order.customerEmail}`);

            // System Log
            const { logSystemActivity } = await import('@/lib/logger');
            await logSystemActivity('EMAIL_SEND', 'INFO', `Order Status Update sent to ${order.customerEmail}`, { invoiceNo: order.invoiceNo, status: newStatus }, order.brandId);

            return true;
        } catch (error) {
            console.error('[EmailService] Status Update Error:', error);
            try {
                const { logSystemActivity } = await import('@/lib/logger');
                await logSystemActivity('EMAIL_SEND', 'ERROR', `Failed to send status update to ${order.customerEmail}`, { invoiceNo: order.invoiceNo, error: String(error) }, order.brandId);
            } catch (e) { }

            return false;
        }
    }

    static async sendAdminAlert(subject: string, message: string, attachments?: any[]) {
        const adminEmail = process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER;
        if (!adminEmail) return false;

        try {
            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: adminEmail,
                subject: `⚠️ Alert: ${subject}`,
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', -apple-system, system-ui, sans-serif; margin: 0; padding: 0; background-color: #FEF2F2; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; border: 2px solid #FCA5A5; overflow: hidden; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.1); }
        .header { background: #DC2626; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; color: #4B5563; line-height: 1.6; }
        .alert-badge { display: inline-block; padding: 4px 12px; background: #FEE2E2; color: #B91C1C; border-radius: 100px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
        .message-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; color: #1F2937; white-space: pre-line; font-family: 'Courier New', monospace; font-size: 14px; }
        .footer { background: #F3F4F6; padding: 24px; text-align: center; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">⚠️ ADMIN ALERT</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Achiera System Monitoring</p>
        </div>
        <div class="content">
            <div class="alert-badge">Critical Notification</div>
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">${subject}</h2>
            <div class="message-box">${message}</div>
            
            <p style="margin-top: 24px; font-size: 13px;">Tindakan segera mungkin diperlukan. Silakan cek dashboard admin untuk detail lebih lanjut.</p>
        </div>
        <div class="footer">
            <p>Automated Alert System • Achiera Platform<br>© 2026 Achiera Holding</p>
        </div>
    </div>
</body>
</html>`,
                attachments: attachments
            });
            return true;
        } catch (error) {
            console.error('[EmailService] Admin Alert Error:', error);
            return false;
        }
    }

    /**
     * Send OTP email for authentication
     */
    static async sendOTPEmail(email: string, code: string, type: string) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';
        const typeLabels: Record<string, string> = {
            'OTP_LOGIN': 'Login',
            'OTP_REGISTER': 'Registrasi',
            'OTP_FORGOT_PASSWORD': 'Reset Password',
            'OTP_PROFILE_UPDATE': 'Update Profil',
        };

        const label = typeLabels[type] || 'Verifikasi';

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 500px; margin: 60px auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 20px 40px rgba(45,58,45,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 60px 40px; text-align: center; }
        .content { padding: 40px; text-align: center; }
        .footer { background: #F9F7F2; padding: 40px; text-align: center; color: #8B7E66; font-size: 12px; border-top: 1px solid #E5E1D8; }
        h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
        .otp-box { background: #FDFBF7; padding: 40px; border-radius: 24px; margin: 32px 0; border: 2px dashed #D1CBBF; position: relative; }
        .otp-code { font-size: 48px; font-weight: 900; letter-spacing: 0.15em; color: #2D3A2D; margin: 24px 0; font-family: 'Courier New', monospace; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; display: block; margin-bottom: 12px; }
        .warning { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 16px; padding: 20px; margin: 32px 0; font-size: 13px; color: #856404; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${appUrl}/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" style="height: 60px; margin-bottom: 24px;">
            <span class="accent" style="color: #B2BCA2;">Keamanan Akun</span>
            <h1>Verifikasi Identitas Bunda 🔐</h1>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #4A5D4A;">Halo, Bunda! Kami menerima permintaan untuk <strong>${label}</strong> pada akun Bunda. Silakan gunakan kode di bawah ini:</p>
            
            <div class="otp-box">
                <span class="accent" style="margin-bottom: 0;">Kode OTP Anda</span>
                <div class="otp-code">${code}</div>
                <p style="margin: 0; font-size: 12px; color: #8B7E66; font-weight: 700;">BERLAKU SELAMA 10 MENIT</p>
            </div>

            <div class="warning">
                <strong>🛡️ Tips Keamanan:</strong><br/>
                Bunda, mohon jaga kerahasiaan kode ini. Tim Rasa Ibu tidak akan pernah meminta kode OTP Bunda melalui WhatsApp, telepon, atau media lainnya.
            </div>

            <p style="font-size: 13px; color: #8B7E66; margin-top: 32px;">Jika Bunda tidak merasa melakukan permintaan ini, silakan abaikan email ini atau hubungi bantuan kami.</p>
        </div>
        <div class="footer">
            <p><strong>Sistem Keamanan Achiera Platform</strong></p>
            <p style="margin-top: 8px;">© 2026 Achiera Platform. Semua Hak Dilindungi.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        try {
            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: email,
                subject: `[Achiera] Kode OTP ${label}: ${code}`,
                html: html,
            });
            console.log(`[EmailService] OTP email sent to ${email} for ${type}`);

            // System Log
            try {
                const { logSystemActivity } = await import('@/lib/logger');
                await logSystemActivity('EMAIL_SEND', 'INFO', `OTP sent to ${email}`, { type }, undefined);
            } catch (e) { }

            return true;
        } catch (error) {
            console.error('[EmailService] OTP Email Error:', error);
            try {
                const { logSystemActivity } = await import('@/lib/logger');
                await logSystemActivity('EMAIL_SEND', 'ERROR', `Failed to send OTP to ${email}`, { error: String(error) }, undefined);
            } catch (e) { }
            return false;
        }
    }

    /**
     * Send subscription invoice email
     */
    static async sendSubscriptionInvoice(subscription: any) {
        if (!subscription.customerEmail) {
            console.warn('[EmailService] Skipping subscription invoice: No customer email');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.achiera.com';
        const profileUrl = `${appUrl}/rasa-ibu/profile?tab=subscription`;

        // Calculate total from items
        const items = subscription.items || [];
        const total = items.reduce((sum: number, item: any) => {
            return sum + (Number(item.variant?.price || 0) * item.quantity);
        }, 0);

        // Default bank info
        let bankInfo = { bankName: 'BCA', accountNo: '2330620385', accountName: 'MAHESA JULIO RESMAN' };
        let qrisUrl: string | undefined = undefined;

        // Fetch brand settings and bank info
        try {
            const { prisma } = await import('@/lib/prisma');

            // Fetch bank info from database
            const brandBank = await prisma.bankAccount.findFirst({
                where: { brandId: subscription.brandId || undefined, isActive: true },
                orderBy: { createdAt: 'desc' }
            });

            if (brandBank) {
                bankInfo = {
                    bankName: brandBank.bankName,
                    accountNo: brandBank.accountNumber,
                    accountName: brandBank.accountHolder
                };
            }

            if (subscription.brandId) {
                const brand = await prisma.brand.findUnique({
                    where: { id: subscription.brandId },
                    select: { paymentSettings: true }
                });
                const settings = brand?.paymentSettings as any;
                if (settings) {
                    qrisUrl = settings.qrisImageUrl;
                }
            }
        } catch (error) {
            console.error(`[EmailService] Failed to fetch brand/bank settings for subscription:`, error);
        }

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', -apple-system, system-ui, sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 20px 40px rgba(45,58,45,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 60px 40px; text-align: center; position: relative; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 40px; text-align: center; color: #8B7E66; font-size: 12px; border-top: 1px solid #E5E1D8; }
        h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; }
        .invoice-box { background: #FDFBF7; padding: 32px; border-radius: 24px; margin: 24px 0; border: 1px solid #E5E1D8; }
        .receipt-table { width: 100%; border-collapse: collapse; margin: 32px 0; font-size: 14px; }
        .receipt-table th { text-align: left; border-bottom: 2px solid #F3F1ED; padding: 12px; color: #8B7E66; font-weight: 900; text-transform: uppercase; font-size: 10px; }
        .receipt-table td { padding: 16px 12px; border-bottom: 1px solid #F3F1ED; }
        .button { display: inline-block; padding: 18px 36px; background: #2D3A2D; color: #FDFBF7 !important; text-decoration: none; border-radius: 20px; font-weight: 900; margin-top: 24px; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.25em; display: block; margin-bottom: 12px; }
        .highlight { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 20px; padding: 24px; margin: 32px 0; }
        .payment-box { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 24px; padding: 32px; margin: 32px 0; }
        .payment-title { font-weight: 900; color: #856404; font-size: 15px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em; }
        .bank-info { background: white; padding: 24px; border-radius: 20px; border: 1px solid rgba(133, 100, 4, 0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${appUrl}/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" style="height: 70px; margin-bottom: 24px;">
            <span class="accent" style="color: #B2BCA2;">Berlangganan Dapur Rasa Ibu</span>
            <h1>Paket Berlangganan Bunda Siap Diantar! 🎉</h1>
        </div>
        <div class="content">
            <p style="font-size: 18px; margin-top: 0;">Halo, <strong>Bunda ${subscription.customerName}</strong>!</p>
            <p style="color: #4A5D4A; font-size: 15px;">Kabar gembira! Paket Berlangganan Bunda sudah aktif. Tim dapur kami siap menyajikan kehangatan masakan rumah langsung ke meja makan Bunda.</p>
            
            <div class="invoice-box">
                <table width="100%">
                    <tr>
                        <td style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #8B7E66;">Paket Pilihan</td>
                        <td align="right" style="font-weight: 900; color: #2D3A2D;">${subscription.plan?.name || 'Custom Plan'}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #8B7E66; padding-top: 12px;">Interval</td>
                        <td align="right" style="font-weight: 800; color: #2D3A2D; padding-top: 12px;">${subscription.interval === 'WEEKLY' ? 'Tagihan Mingguan' : 'Tagihan Bulanan'}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 16px 0;"><div style="border-top: 1px solid #E5E1D8;"></div></td>
                    </tr>
                    <tr>
                        <td style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #8B7E66;">Total Tagihan</td>
                        <td align="right" style="font-size: 24px; font-weight: 900; color: #2D3A2D;">Rp ${total.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <h3 style="font-size: 18px; font-weight: 900; margin-top: 40px;">📦 Rincian Paket Hidangan</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Menu</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Harga</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: any) => `
                        <tr>
                            <td>
                                <strong style="color: #2D3A2D;">${item.variant?.product?.name || 'Varian Menu'}</strong><br/>
                                <span style="font-size: 11px; color: #8B7E66;">${item.variant?.name || 'Porsi Normal'}</span>
                            </td>
                            <td align="center" style="font-weight: 700;">${item.quantity}</td>
                            <td align="right" style="font-weight: 700;">Rp ${(Number(item.variant?.price || 0) * item.quantity).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="2" align="right" style="font-weight: 900; padding: 24px 12px 0 0; color: #8B7E66;">TOTAL</td>
                        <td align="right" style="font-weight: 900; padding: 24px 0 0 0; font-size: 18px; color: #2D3A2D;">Rp ${total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div class="payment-box">
                <div class="payment-title">💳 Cara Pembayaran</div>
                
                ${subscription.paymentMethod === 'QRIS' && qrisUrl ? `
                    <p style="margin: 0; font-size: 14px; color: #856404;">Silakan scan kode QRIS di bawah ini:</p>
                    <div style="text-align: center; margin-top: 24px; background: white; padding: 32px; border-radius: 24px; border: 1px solid rgba(133, 100, 4, 0.1);">
                        <img src="${qrisUrl}" alt="QRIS" style="max-width: 200px; height: auto;" />
                        <p style="font-size: 10px; color: #8B7E66; margin-top: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Scan aman & cepat</p>
                    </div>
                ` : `
                    <p style="margin: 0; font-size: 14px; color: #856404;">Silakan transfer ke rekening resmi kami:</p>
                    <div class="bank-info">
                        <table width="100%">
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase;">Bank</td>
                                <td align="right" style="font-weight: 800; color: #2D3A2D;">${bankInfo.bankName}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase; padding: 12px 0;">No. Rekening</td>
                                <td align="right" style="font-weight: 900; font-size: 20px; color: #2D3A2D; padding: 12px 0;">${bankInfo.accountNo}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 10px; font-weight: 900; color: #8B7E66; text-transform: uppercase;">Atas Nama</td>
                                <td align="right" style="font-weight: 800; color: #2D3A2D;">${bankInfo.accountName}</td>
                            </tr>
                        </table>
                    </div>
                `}
                
                <p style="margin-top: 20px; font-size: 13px; color: #856404; font-weight: bold; background: rgba(255,255,255,0.5); padding: 16px; border-radius: 16px;">
                    💡 Bunda, setelah bayar jangan lupa unggah buktinya melalui menu Profil ya, supaya tim dapur kami bisa langsung tancap gas menyiapkan hidangan.
                </p>
            </div>

            ${subscription.deliveryDays ? `
            <div class="highlight">
                <span style="font-size: 20px; display: block; margin-bottom: 8px;">📅</span>
                <strong style="color: #2D3A2D;">Jadwal Pengiriman Bunda:</strong><br/>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #4A5D4A;">
                    ${(() => {
                    try {
                        const days = typeof subscription.deliveryDays === 'string'
                            ? JSON.parse(subscription.deliveryDays)
                            : subscription.deliveryDays;

                        if (!Array.isArray(days)) return 'Sesuai Jadwal Rasa Ibu';

                        const dayMap: Record<string, string> = {
                            'MON': 'Senin', 'TUE': 'Selasa', 'WED': 'Rabu',
                            'THU': 'Kamis', 'FRI': 'Jumat', 'SAT': 'Sabtu', 'SUN': 'Minggu'
                        };

                        return days.map((d: any) => `${dayMap[d.day] || d.day} (${d.timeSlot})`).join(', ');
                    } catch (e) {
                        return 'Sesuai Jadwal Rasa Ibu';
                    }
                })()}
                </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 14px; color: #8B7E66; margin-bottom: 8px;">Kelola langganan Bunda di sini:</p>
                <a href="${profileUrl}" class="button">Lihat Profil Berlangganan</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Dapur Berlangganan Rasa Ibu - Oleh Achiera</strong></p>
            <p style="margin-top: 8px;">© ${new Date().getFullYear()} Achiera Holding. Semua Hak Dilindungi.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        try {
            await this.transporter.sendMail({
                from: EmailService.getFromAddress(),
                to: subscription.customerEmail,
                subject: `[Achiera] Langganan Bunda Aktif - ${subscription.plan?.name || 'Custom'}`,
                html: html,
            });
            console.log(`[EmailService] Subscription invoice sent to ${subscription.customerEmail}`);

            // System Log
            const { logSystemActivity } = await import('@/lib/logger');
            await logSystemActivity('EMAIL_SEND', 'INFO', `Subscription invoice sent to ${subscription.customerEmail}`, { subscriptionId: subscription.id, plan: subscription.plan?.name }, subscription.brandId);

            return true;
        } catch (error) {
            console.error('[EmailService] Subscription Invoice Error:', error);
            try {
                const { logSystemActivity } = await import('@/lib/logger');
                await logSystemActivity('EMAIL_SEND', 'ERROR', `Failed to send subscription invoice to ${subscription.customerEmail}`, { subscriptionId: subscription.id, error: String(error) }, subscription.brandId);
            } catch (e) { }
            return false;
        }
    }
}

