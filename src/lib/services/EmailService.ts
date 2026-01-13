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
        const rawName = process.env.SMTP_FROM_NAME || 'Achiera Platform';
        const cleanName = rawName.replace(/>/g, '').trim();
        const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
        return `"${cleanName}" <${fromEmail}>`;
    }

    static async sendOrderConfirmation(order: EmailOrderInfo, loyalty?: LoyaltyInfo) {
        // For gift orders, send to recipient email if available
        const recipientEmail = order.isGift && order.recipientEmail ? order.recipientEmail : order.customerEmail;

        if (!recipientEmail) {
            console.warn('[EmailService] Skipping: No email provided');
            return false;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

        // Default bank info, can be overridden by brand settings
        let bankInfo = { bankName: 'BCA', accountNo: '8000818181', accountName: 'RASA IBU - ACHIERA' };
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

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E5E1D8; shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 30px; text-align: center; color: #8B7E66; font-size: 12px; }
        h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .invoice-box { background: #F9F7F2; padding: 20px; border-radius: 16px; margin: 20px 0; border: 1px dashed #D1CBBF; }
        .loyalty-card { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 20px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; padding: 16px 32px; background: #2D3A2D; color: #FDFBF7; text-decoration: none; border-radius: 16px; font-weight: bold; margin-top: 20px; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        
        .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .receipt-table th { text-align: left; border-bottom: 2px solid #F3F1ED; padding: 10px; color: #8B7E66; }
        .receipt-table td { padding: 12px 10px; border-bottom: 1px solid #F3F1ED; }
        
        .payment-box { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 16px; padding: 24px; margin: 24px 0; }
        .payment-title { font-weight: 900; color: #856404; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .bank-info { background: white; padding: 16px; border-radius: 12px; margin-top: 12px; border: 1px solid #FFE58F; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:rasa-ibu-logo" alt="Rasa Ibu" style="height: 60px; margin-bottom: 20px;">
            <span class="accent" style="color: #B2BCA2; display: block;">Achiera Rasa Ibu</span>
            <h1>${order.isGift ? '🎁 Hadiah Spesial Untuk Bunda!' : 'Pesanan Bunda Sudah Kami Terima! 🥘✨'}</h1>
        </div>
        <div class="content">
            <p>Halo <strong>${order.isGift ? (order.recipientName || 'Sahabat') : order.customerName}</strong>!</p>
            <p>${order.isGift
                ? `Anda menerima hadiah istimewa dari <strong>${order.customerName}</strong>! Pesanan sudah kami terima dan sedang disiapkan dengan penuh cinta.`
                : 'Terima kasih sudah jajan di Rasa Ibu. Kami sudah menerima pesanan Bunda dan sedang menyiapkan yang terbaik untuk diantarkan.'
            }</p>
            
            <div class="invoice-box">
                <table width="100%">
                    <tr>
                        <td style="font-size: 12px; color: #8B7E66;">ID Invoice</td>
                        <td align="right" style="font-weight: bold;">${order.invoiceNo}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #8B7E66;">Total Pembayaran</td>
                        <td align="right" style="font-size: 18px; font-weight: 900; color: #2D3A2D;">Rp ${order.total.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <!-- Gift Card Section -->
            ${order.isGift ? `
            <div style="margin: 24px 0; background-color: #FDFBF7; border: 1px dashed #E5E1D8; border-radius: 16px; padding: 24px;">
                <div style="text-align: center; margin-bottom: 16px;">
                    <span style="display: inline-block; background-color: #FCE7F3; color: #DB2777; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">Gift Order</span>
                </div>
                <h3 style="margin: 0 0 16px 0; color: #2D3A2D; font-size: 16px; font-weight: 800; text-align: center; letter-spacing: -0.02em;">
                    Dikirim dengan penuh cinta dari ${order.customerName}
                </h3>
                <div style="background-color: white; padding: 20px; border-radius: 12px; font-style: italic; color: #8B7E66; line-height: 1.6; text-align: center; border: 1px solid #E5E1D8;">
                    "${order.giftMessage || 'Enjoy this special treat!'}"
                </div>
            </div>
            ` : ''}

            <!-- Receipt Section -->
            <h3 style="font-size: 16px; margin: 30px 0 10px 0;">🧾 Rincian Pesanan</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${((order.items || (order as any).orderItems) || []).map((item: any) => `
                        <tr>
                            <td>
                                <strong>${item.name}</strong><br/>
                                <span style="font-size: 11px; color: #8B7E66;">${item.variantName || 'Normal'}</span>
                            </td>
                            <td align="center">${item.quantity}</td>
                            <td align="right">Rp ${Number(item.subtotal || (item.price * item.quantity)).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="2" align="right" style="font-weight: bold; padding-top: 20px;">Total</td>
                        <td align="right" style="font-weight: 900; padding-top: 20px; font-size: 16px;">Rp ${order.total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Payment Instructions (Conditional) - Only show to customer, not gift recipient -->
            ${!order.isGift && ['WAITING_PAYMENT', 'DIPESAN'].includes(order.status || '') ? `
            <div class="payment-box">
                <div class="payment-title">⚠️ Petunjuk Pembayaran</div>
                
                ${order.paymentMethod === 'QRIS' && qrisUrl ? `
                    <p style="margin: 0; font-size: 13px;">Silakan scan kode QRIS di bawah ini untuk membayar:</p>
                    <div style="text-align: center; margin-top: 20px; background: white; padding: 20px; border-radius: 16px;">
                        <img src="${qrisUrl}" alt="QRIS" style="max-width: 200px; height: auto;" />
                        <p style="font-size: 10px; color: #8B7E66; margin-top: 10px; font-weight: bold;">SCAN DENGAN BANK / E-WALLET APA SAJA</p>
                    </div>
                ` : `
                    <p style="margin: 0; font-size: 13px;">Silakan selesaikan pembayaran agar pesanan Bunda bisa segera kami proses:</p>
                    <div class="bank-info">
                        <table width="100%">
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">Bank</td>
                                <td style="font-weight: 800;">${bankInfo.bankName}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">No. Rekening</td>
                                <td style="font-weight: 900; font-size: 16px;">${bankInfo.accountNo}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">Atas Nama</td>
                                <td style="font-weight: 800;">${bankInfo.accountName}</td>
                            </tr>
                        </table>
                    </div>
                `}
                
                <p style="margin-top: 15px; font-size: 12px; color: #856404; font-weight: bold;">
                    ⚠️ Penting: Setelah melakukan transfer, mohon klik tombol "Lacak Pesanan" di bawah dan unggah foto bukti transfer Bunda agar pesanan bisa segera kami verifikasi dan kirim.
                </p>
            </div>
            ` : ''}

            ${loyalty && !order.isGift ? `
            <div class="loyalty-card">
                <p style="margin: 0; font-size: 14px;">✨ <strong>Selamat Bunda!</strong> Bunda dapat <strong>${loyalty.pointsEarned} Poin</strong> dari pesanan ini.</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Total Poin Bunda sekarang: <strong>${loyalty.currentBalance} Poin</strong>.</p>
            </div>
            ` : ''}

            <div style="text-align: center;">
                <p style="font-size: 14px; color: #8B7E66;">${order.isGift ? 'Lacak status pengiriman hadiah Anda di sini:' : 'Bunda bisa melacak status pesanan secara real-time di sini:'}</p>
                <a href="${trackingUrl}" class="button">Lacak Pesanan ${order.isGift ? 'Hadiah' : 'Bunda'}</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2026 Rasa Ibu - Achiera. Semua Hak Dilindungi.<br>Dapur Utama Rasa Ibu</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        await this.transporter.sendMail({
            from: this.getFromAddress(),
            to: recipientEmail,
            subject: order.isGift
                ? `[Achiera] 🎁 Hadiah Spesial Untuk Anda! #${order.invoiceNo}`
                : `[Achiera] Konfirmasi Pesanan #${order.invoiceNo}`,
            html: html,
            attachments: [{
                filename: 'rasa-ibu-logo.png',
                path: path.join(process.cwd(), 'public', 'images', 'logos', 'rasa-ibu-logo.png'),
                cid: 'rasa-ibu-logo'
            }]
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
    } catch(error) {
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

    static async sendStatusUpdate(order: EmailOrderInfo, newStatus: string) {
    if (!order.customerEmail) {
        console.warn('[EmailService] Skipping Status Update: No customer email provided');
        return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E5E1D8; }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 30px; text-align: center; color: #8B7E66; font-size: 12px; }
        h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .status-box { background: #F9F7F2; padding: 20px; border-radius: 16px; margin: 20px 0; text-align: center; border: 1px solid #E5E1D8; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #B2BCA2; color: #2D3A2D; border-radius: 99px; font-weight: 900; font-size: 12px; margin-top: 10px; }
        .button { display: inline-block; padding: 16px 32px; background: #2D3A2D; color: #FDFBF7; text-decoration: none; border-radius: 16px; font-weight: bold; margin-top: 20px; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:rasa-ibu-logo" alt="Rasa Ibu" style="height: 60px; margin-bottom: 20px;">
            <span class="accent" style="color: #B2BCA2; display: block;">Achiera Rasa Ibu</span>
            <h1>Update Pesanan Bunda 🚀</h1>
        </div>
        <div class="content">
            <p>Halo <strong>${order.customerName}</strong>!</p>
            <p>Ada kabar terbaru untuk pesanan Bunda dengan nomor invoice <strong>${order.invoiceNo}</strong>.</p>
            
            <div class="status-box">
                <p style="margin: 0; font-size: 14px; color: #8B7E66;">Status Saat Ini:</p>
                <div class="status-badge">${newStatus}</div>
            </div>

            <div style="text-align: center;">
                <p style="font-size: 14px; color: #8B7E66;">Bunda bisa melacak detail pergerakannya di sini:</p>
                <a href="${trackingUrl}" class="button" style="color: #FDFBF7;">Lacak Pesanan</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #8B7E66;">Mohon ditunggu ya Bunda! Kami akan segera mengantarkannya. 🙏✨</p>
        </div>
        <div class="footer">
            <p>© 2026 Rasa Ibu - Achiera. Semua Hak Dilindungi.<br>Dapur Utama Rasa Ibu</p>
        </div>
    </div>
</body>
</html>
        `.trim();

    try {
        // Clean sender name
        const rawFromName = process.env.SMTP_FROM_NAME || 'Achiera Platform';
        const cleanFromName = rawFromName.replace(/>/g, '').trim();

        await this.transporter.sendMail({
            from: `"${cleanFromName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: order.customerEmail,
            subject: `[Achiera] Update Pesanan #${order.invoiceNo}: ${newStatus}`,
            html: html,
            attachments: [{
                filename: 'rasa-ibu-logo.png',
                path: path.join(process.cwd(), 'public', 'images', 'logos', 'rasa-ibu-logo.png'),
                cid: 'rasa-ibu-logo'
            }]
        });
        console.log(`[EmailService] Status update sent to ${order.customerEmail}`);
        return true;
    } catch (error) {
        console.error('[EmailService] Status Update Error:', error);
        return false;
    }
}

    static async sendAdminAlert(subject: string, message: string, attachments ?: any[]) {
    const adminEmail = process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) return false;

    try {
        await this.transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Achiera Alert'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `⚠️ Alert: ${subject}`,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #d32f2f;">Admin Alert</h2>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>`,
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
    const typeLabels: Record<string, string> = {
        'OTP_LOGIN': 'Login',
        'OTP_REGISTER': 'Registrasi',
        'OTP_FORGOT_PASSWORD': 'Reset Password',
        'OTP_PROFILE_UPDATE': 'Update Profil',
    };

    const label = typeLabels[type] || 'Verifikasi';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .otp-box { background: #F9F7F2; padding: 30px; border-radius: 16px; margin: 20px 0; text-align: center; border: 2px dashed #D1CBBF; }
        .otp-code { font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #2D3A2D; margin: 20px 0; font-family: 'Courier New', monospace; }
        .footer { background: #F9F7F2; padding: 30px; text-align: center; color: #8B7E66; font-size: 12px; }
        h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        .warning { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:rasa-ibu-logo" alt="Rasa Ibu" style="height: 60px; margin-bottom: 20px;">
            <span class="accent" style="color: #B2BCA2; display: block;">Achiera Rasa Ibu</span>
            <h1>Kode Verifikasi ${label} 🔐</h1>
        </div>
        <div class="content">
            <p>Halo!</p>
            <p>Berikut adalah kode OTP untuk ${label} Anda:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 12px; color: #8B7E66; text-transform: uppercase; letter-spacing: 1px;">Kode OTP Anda</p>
                <div class="otp-code">${code}</div>
                <p style="margin: 0; font-size: 12px; color: #8B7E66;">Berlaku selama 10 menit</p>
            </div>

            <div class="warning">
                ⚠️ <strong>Penting:</strong> Jangan bagikan kode ini kepada siapapun, termasuk staff Achiera. Kami tidak akan pernah meminta kode OTP Anda.
            </div>

            <p style="font-size: 13px; color: #8B7E66; margin-top: 30px;">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
        </div>
        <div class="footer">
            <p>© 2026 Rasa Ibu - Achiera. Semua Hak Dilindungi.<br>Dapur Utama Rasa Ibu</p>
        </div>
    </div>
</body>
</html>
        `.trim();

    try {
        // Clean sender name
        const rawFromName = process.env.SMTP_FROM_NAME || 'Achiera Platform';
        const cleanFromName = rawFromName.replace(/>/g, '').trim();

        await this.transporter.sendMail({
            from: `"${cleanFromName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: `[Achiera] Kode OTP ${label}: ${code}`,
            html: html,
            attachments: [{
                filename: 'rasa-ibu-logo.png',
                path: path.join(process.cwd(), 'public', 'images', 'logos', 'rasa-ibu-logo.png'),
                cid: 'rasa-ibu-logo'
            }]
        });
        console.log(`[EmailService] OTP email sent to ${email} for ${type}`);
        return true;
    } catch (error) {
        console.error('[EmailService] OTP Email Error:', error);
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #2D3A2D; line-height: 1.6; margin: 0; padding: 0; background-color: #FDFBF7; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #2D3A2D; color: #FDFBF7; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .footer { background: #F9F7F2; padding: 30px; text-align: center; color: #8B7E66; font-size: 12px; }
        h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .invoice-box { background: #F9F7F2; padding: 20px; border-radius: 16px; margin: 20px 0; border: 1px dashed #D1CBBF; }
        .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .receipt-table th { text-align: left; border-bottom: 2px solid #F3F1ED; padding: 10px; color: #8B7E66; }
        .receipt-table td { padding: 12px 10px; border-bottom: 1px solid #F3F1ED; }
        .button { display: inline-block; padding: 16px 32px; background: #2D3A2D; color: #FDFBF7; text-decoration: none; border-radius: 16px; font-weight: bold; margin-top: 20px; }
        .accent { color: #8B7E66; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        .highlight { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .payment-box { background: #FFF9E6; border: 1px solid #FFE58F; border-radius: 16px; padding: 24px; margin: 24px 0; }
        .payment-title { font-weight: 900; color: #856404; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .bank-info { background: white; padding: 16px; border-radius: 12px; margin-top: 12px; border: 1px solid #FFE58F; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:rasa-ibu-logo" alt="Rasa Ibu" style="height: 60px; margin-bottom: 20px;">
            <span class="accent" style="color: #B2BCA2; display: block;">Achiera Rasa Ibu</span>
            <h1>Langganan Katering Aktif! 🎉</h1>
        </div>
        <div class="content">
            <p>Halo <strong>${subscription.customerName}</strong>!</p>
            <p>Terima kasih sudah berlangganan katering Rasa Ibu. Paket langganan Bunda sudah aktif dan siap diantarkan sesuai jadwal.</p>
            
            <div class="invoice-box">
                <table width="100%">
                    <tr>
                        <td style="font-size: 12px; color: #8B7E66;">Paket Langganan</td>
                        <td align="right" style="font-weight: bold;">${subscription.plan?.name || 'Custom'}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #8B7E66;">Interval</td>
                        <td align="right" style="font-weight: bold;">${subscription.interval === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #8B7E66;">Total per ${subscription.interval === 'WEEKLY' ? 'Minggu' : 'Bulan'}</td>
                        <td align="right" style="font-size: 18px; font-weight: 900; color: #2D3A2D;">Rp ${total.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <h3 style="font-size: 16px; margin: 30px 0 10px 0;">📦 Rincian Paket</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Harga</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: any) => `
                        <tr>
                            <td>
                                <strong>${item.variant?.product?.name || 'Produk'}</strong><br/>
                                <span style="font-size: 11px; color: #8B7E66;">${item.variant?.name || 'Normal'}</span>
                            </td>
                            <td align="center">${item.quantity}</td>
                            <td align="right">Rp ${(Number(item.variant?.price || 0) * item.quantity).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="2" align="right" style="font-weight: bold; padding-top: 20px;">Total</td>
                        <td align="right" style="font-weight: 900; padding-top: 20px; font-size: 16px;">Rp ${total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Payment Instructions -->
            <div class="payment-box">
                <div class="payment-title">⚠️ Petunjuk Pembayaran</div>
                
                ${subscription.paymentMethod === 'QRIS' && qrisUrl ? `
                    <p style="margin: 0; font-size: 13px;">Silakan scan kode QRIS di bawah ini untuk membayar:</p>
                    <div style="text-align: center; margin-top: 20px; background: white; padding: 20px; border-radius: 16px;">
                        <img src="${qrisUrl}" alt="QRIS" style="max-width: 200px; height: auto;" />
                        <p style="font-size: 10px; color: #8B7E66; margin-top: 10px; font-weight: bold;">SCAN DENGAN BANK / E-WALLET APA SAJA</p>
                    </div>
                ` : `
                    <p style="margin: 0; font-size: 13px;">Silakan selesaikan pembayaran ke rekening berikut:</p>
                    <div class="bank-info">
                        <table width="100%">
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">Bank</td>
                                <td style="font-weight: 800;">${bankInfo.bankName}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">No. Rekening</td>
                                <td style="font-weight: 900; font-size: 16px;">${bankInfo.accountNo}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #8B7E66;">Atas Nama</td>
                                <td style="font-weight: 800;">${bankInfo.accountName}</td>
                            </tr>
                        </table>
                    </div>
                `}
                
                <p style="margin-top: 15px; font-size: 12px; color: #856404; font-weight: bold;">
                    ⚠️ Penting: Setelah melakukan pembayaran, mohon unggah bukti bayar Bunda langsung di website melalui menu profil agar pesanan bisa segera kami verifikasi.
                </p>
            </div>

            ${subscription.deliveryDays ? `
            <div class="highlight">
                <strong>📅 Jadwal Pengiriman:</strong><br/>
                <span style="font-size: 14px;">
                    ${(() => {
                try {
                    const days = typeof subscription.deliveryDays === 'string'
                        ? JSON.parse(subscription.deliveryDays)
                        : subscription.deliveryDays;

                    if (!Array.isArray(days)) return 'Jadwal oleh Rasa Ibu';

                    const dayMap: Record<string, string> = {
                        'MON': 'Senin', 'TUE': 'Selasa', 'WED': 'Rabu',
                        'THU': 'Kamis', 'FRI': 'Jumat', 'SAT': 'Sabtu', 'SUN': 'Minggu'
                    };

                    return days.map((d: any) => {
                        const dayName = dayMap[d.day] || d.day;
                        return `${dayName} (${d.timeSlot})`;
                    }).join(', ');
                } catch (e) {
                    return 'Sesuai Jadwal Rasa Ibu';
                }
            })()}
                </span>
            </div>
            ` : ''}

            <div style="text-align: center;">
                <p style="font-size: 14px; color: #8B7E66;">Silakan upload bukti bayar di:</p>
                <a href="${profileUrl}" class="button">Upload Bukti & Lihat Profil</a>
            </div>

            <p style="margin-top: 30px; font-size: 13px; color: #8B7E66;">Jika Bunda mengalami kesulitan, tim kami siap membantu melalui layanan pelanggan.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Achiera Holding. Semua Hak Dilindungi.<br/>Dapur Utama Rasa Ibu</p>
        </div>
    </div>
</body>
</html>
        `.trim();

    try {
        // Clean sender name
        const rawFromName = process.env.SMTP_FROM_NAME || 'Achiera Platform';
        const cleanFromName = rawFromName.replace(/>/g, '').trim();

        await this.transporter.sendMail({
            from: `"${cleanFromName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: subscription.customerEmail,
            subject: `[Achiera] Langganan Bunda Aktif - ${subscription.plan?.name || 'Custom'}`,
            html: html,
            attachments: [{
                filename: 'rasa-ibu-logo.png',
                path: path.join(process.cwd(), 'public', 'images', 'logos', 'rasa-ibu-logo.png'),
                cid: 'rasa-ibu-logo'
            }]
        });
        console.log(`[EmailService] Subscription invoice sent to ${subscription.customerEmail}`);
        return true;
    } catch (error) {
        console.error('[EmailService] Subscription Invoice Error:', error);
        return false;
    }
}
}

