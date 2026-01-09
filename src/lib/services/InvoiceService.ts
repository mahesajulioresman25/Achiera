
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { addDays, format } from 'date-fns';

export class InvoiceService {

    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    static async generatePDF(order: any): Promise<string> {
        console.log(`[InvoiceService] Generating PDF for ${order.invoiceNo}`);
        // PDF generation logic remains a stub or can be implemented with 'html-pdf-node'
        // For now, we return a dummy link or path
        return `/invoices/${order.invoiceNo}.pdf`;
    }

    static async generateAndSend(order: any) {
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            // 1. Ensure Invoice Record Exists
            let invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });

            if (!invoice) {
                console.log(`[InvoiceService] Creating Invoice record for ${order.invoiceNo}`);
                const dueDate = addDays(new Date(), 1);
                invoice = await prisma.invoice.create({
                    data: {
                        invoiceNumber: order.invoiceNo,
                        orderId: order.id,
                        dueDate,
                        totalAmount: order.total,
                        paymentStatus: 'UNPAID',
                    }
                });
            }

            // Ensure we have items (if passed order doesn't have them)
            let items = order.orderItems;
            if (!items) {
                const orderWithItems = await prisma.order.findUnique({
                    where: { id: order.id },
                    include: { orderItems: true }
                });
                items = orderWithItems?.orderItems || [];
            }

            // 2. Prepare Rich Email Content
            const adminPhone = '6281234567890'; // Replace with real admin WA
            const waLink = `https://wa.me/${adminPhone}?text=Halo%20Admin,%20saya%20mau%20tanya%20soal%20order%20${order.invoiceNo}`;
            const trackLink = `${appUrl}/order/track/${order.invoiceNo}`;
            const invoiceLink = `${appUrl}/invoice/${order.invoiceNo}`;

            // Build Items Rows
            const itemsHtml = items.map((item: any) => `
                <tr>
                    <td>
                        <strong>${item.name}</strong><br/>
                        <span style="font-size:12px; color:#666;">
                            Variant: ${item.variantName || 'Standard'}
                        </span>
                        ${item.metadata ? `
                            <div style="font-size:11px; color:#555; margin-top:4px; padding-top:4px; border-top:1px dashed #eee;">
                                ${item.metadata.printMethod ? `<div>Print: <strong>${(item.metadata.printMethod as string).toUpperCase()}</strong></div>` : ''}
                                ${item.metadata.printSize ? `<div>Size: ${(item.metadata.printSize as string)}</div>` : ''}
                                ${item.metadata.colorCount ? `<div>Colors: ${item.metadata.colorCount}</div>` : ''}
                            </div>
                        ` : ''}
                    </td>
                    <td style="text-align:center;">${item.quantity}</td>
                    <td style="text-align:right;">Rp ${Number(item.subtotal).toLocaleString()}</td>
                </tr>
            `).join('');

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Achiera Store" <noreply@achiera.com>',
                to: order.customerEmail,
                subject: `[Billing] Invoice #${order.invoiceNo} - Menunggu Pembayaran`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                        .wrapper { width: 100%; background-color: #f4f4f4; padding: 20px 0; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                        .header { background-color: #111; padding: 30px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; }
                        .content { padding: 30px; color: #333; }
                        .order-summary { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
                        .order-summary th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; color: #888; text-transform: uppercase; font-size: 11px; }
                        .order-summary td { padding: 10px; border-bottom: 1px solid #eee; }
                        .total-row td { font-weight: bold; border-bottom: none; font-size: 16px; padding-top: 15px; }
                        .payment-box { background-color: #FFFBE6; border: 1px solid #FFE58F; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .production-box { background-color: #F0F5FF; border: 1px solid #ADC6FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .btn-group { text-align: center; margin: 30px 0; }
                        .btn { display: inline-block; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
                        .btn-primary { background-color: #000; color: #fff; }
                        .btn-outline { background-color: transparent; border: 1px solid #ccc; color: #555; }
                        .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
                        .alert { color: #d46b08; font-weight: bold; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            
                            <!-- Header -->
                            <div class="header">
                                <h1>ACHIERA</h1>
                                <p style="color:#666; font-size:12px; margin-top:5px; text-transform:uppercase; letter-spacing:1px;">Merchandise & IT Solutions</p>
                            </div>

                            <div class="content">
                                <p>Halo <strong>${order.customerName}</strong>,</p>
                                <p>Terima kasih telah memesan di Achiera! Pesanan Anda <strong>#${order.invoiceNo}</strong> sudah kami terima dan menunggu pembayaran untuk diproses.</p>

                                <!-- Order Summary -->
                                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px;">🧾 Ringkasan Order</h3>
                                <table class="order-summary">
                                    <thead>
                                        <tr>
                                            <th>Produk</th>
                                            <th style="text-align:center;">Qty</th>
                                            <th style="text-align:right;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                        <tr class="total-row">
                                            <td colspan="2" style="text-align:right;">Total Tagihan</td>
                                            <td style="text-align:right;">Rp ${Number(order.total).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <p style="font-size:12px; color:#666;">Note: ${order.customerNote || '-'}</p>

                                <!-- Payment Info -->
                                <div class="payment-box">
                                    <div class="alert">⚠️ MENUNGGU PEMBAYARAN</div>
                                    <p style="margin: 5px 0; font-size: 14px;">Silakan transfer sesuai nominal persis ke:</p>
                                    
                                    <h2 style="margin: 15px 0; font-size: 20px; color: #333;">BANK BCA</h2>
                                    <p style="margin: 2px 0;">No. Rek: <strong>1234567890</strong></p>
                                    <p style="margin: 2px 0;">A.N: <strong>PT ACHIERA KREATIF</strong></p>
                                    
                                    <hr style="border: 0; border-top: 1px dashed #d9d9d9; margin: 15px 0;">
                                    
                                    <p style="margin: 5px 0;"><strong>Total Bayar:</strong> Rp ${Number(order.total).toLocaleString()}</p>
                                    <p style="margin: 5px 0; color: #d46b08; font-size: 12px;">* Mohon sertakan berita transfer: ${order.invoiceNo}</p>
                                </div>

                                <!-- Production Info -->
                                <div class="production-box">
                                    <h4 style="margin-top:0;">🛡️ Informasi Produksi</h4>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
                                        <li><strong>Estimasi Produksi:</strong> 3-7 Hari Kerja (setelah lunas)</li>
                                        <li><strong>Estimasi Pengiriman:</strong> Sesuai ekspedisi yang dipilih</li>
                                    </ul>
                                </div>

                                <!-- Action Buttons -->
                                <div class="btn-group">
                                    <a href="${trackLink}" class="btn btn-primary">Upload Bukti Bayar / Lacak</a>
                                    <a href="${invoiceLink}" class="btn btn-outline">Download Invoice</a>
                                </div>
                                <div style="text-align:center; margin-bottom:20px;">
                                    <a href="${waLink}" style="color:#000; text-decoration:underline; font-size:12px;">Chat Admin (WhatsApp)</a>
                                </div>

                                <!-- Terms -->
                                <div style="background:#eee; padding:15px; border-radius:6px; font-size:11px; color:#666;">
                                    <strong>Syarat & Ketentuan:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Produksi dimulai setelah pembayaran terverifikasi.</li>
                                        <li>Perubahan desain hanya bisa dilakukan sebelum produksi dimulai.</li>
                                        <li>Barang yang sudah diproduksi tidak dapat dibatalkan (No Refund).</li>
                                        <li>Harap simpan bukti pembayaran hingga status LUNAS.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} Achiera. All rights reserved.</p>
                                <p>Ini adalah email otomatis, mohon tidak membalas email ini.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `
            };

            // 3. Send Email
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[InvoiceService] Email sent to ${order.customerEmail}: ${info.messageId}`);
            return true;

        } catch (error) {
            console.error('[InvoiceService] Failed to send email:', error);
            return false;
        }
    }
}
