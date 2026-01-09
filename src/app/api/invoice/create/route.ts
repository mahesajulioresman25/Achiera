
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCode } from '@/lib/qrcode';
import { addDays, format } from 'date-fns';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true, variant: true } // Assuming single product order for now as per schema
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findUnique({
            where: { orderId: orderId }
        });

        if (existingInvoice) {
            return NextResponse.json(existingInvoice);
        }

        // Generate Invoice Number: ACH-INV-YYYYMMDD-XXXX
        const dateStr = format(new Date(), 'yyyyMMdd');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `ACH-INV-${dateStr}-${randomSuffix}`;

        // URLs
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trackingUrl = `${appUrl}/order/track/${order.invoiceNo}`; // Using Order InvoiceNo for logic consistency or new Invoice Number?
        // User asked: QR Tracking = /tracking/[invoiceNumber]
        const qrTrackingUrl = `${appUrl}/tracking/${invoiceNumber}`;

        // Mock QRIS Payment URL (In real life, get from Gateway)
        // Using a deep link or just a string for now
        const qrPaymentUrl = `achiera://pay?inv=${invoiceNumber}&amt=${order.total}`;

        // QR Images
        const qrPaymentImage = await generateQRCode(qrPaymentUrl);
        const qrTrackingImage = await generateQRCode(qrTrackingUrl);

        // Due Date: +1 Day
        const dueDate = addDays(new Date(), 1);

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                orderId: order.id,
                dueDate,
                totalAmount: order.total,
                paymentStatus: 'UNPAID',
                qrPaymentUrl: qrPaymentImage, // Storing Base64 for simplicity as requested, or URL? 
                // "QR Payment = URL Payment". The field says Url. 
                // Re-reading request: "QR harus menghasilkan data: ... QR Payment = URL Payment"
                // Model: qrPaymentUrl String
                // I will store the *Data Payload* in the DB, and generate the PNG on the fly? 
                // OR store the PNG Data URL? 
                // Request says: "Mendapatkan detail invoice termasuk URL QR". 
                // I'll store the *Text Content* of the QR code in `qrPaymentUrl` field, 
                // but the API/Frontend will convert it to image.
                // Wait, frontend usually needs the image.
                // Let's store the actual Target URL in the DB: `achiera://...`
                // And generate the QR Image in the Frontend or API response.
                // Re-reading: "GET /api/invoice/[inv] -> detail invoice termasuk URL QR"
                // It likely means "URL string to be encoded in QR" OR "URL of the QR Image".
                // I'll stick to storing the *Target URL* in DB.
                qrPaymentUrl: qrPaymentUrl, // The link to pay
                qrTrackingUrl: qrTrackingUrl, // The link to track
            }
        });

        // Create Order Item (Single item from Order)
        await prisma.orderItem.create({
            data: {
                orderId: order.id,
                name: order.product?.displayName || 'Custom Product',
                variantName: order.variant?.name || 'Standard',
                quantity: order.quantity,
                price: order.subtotal.div(order.quantity), // Calculate unit price
                subtotal: order.subtotal
            }
        });

        return NextResponse.json({
            success: true,
            invoice,
            qrCodes: {
                payment: qrPaymentImage, // Return Base64 for immediate display
                tracking: qrTrackingImage
            }
        });

    } catch (error) {
        console.error('Create Invoice Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
