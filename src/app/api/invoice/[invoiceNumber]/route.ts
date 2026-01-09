
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCode } from '@/lib/qrcode';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ invoiceNumber: string }> }
) {
    try {
        const resolvedParams = await params;
        const { invoiceNumber } = resolvedParams;

        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber },
            include: {
                order: {
                    include: {
                        orderItems: true,
                        // Include customer details from Order
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Generate QR Images on the fly
        const qrPaymentImage = invoice.qrPaymentUrl ? await generateQRCode(invoice.qrPaymentUrl) : null;
        const qrTrackingImage = invoice.qrTrackingUrl ? await generateQRCode(invoice.qrTrackingUrl) : null;

        return NextResponse.json({
            ...invoice,
            qrImages: {
                payment: qrPaymentImage,
                tracking: qrTrackingImage
            },
            customer: {
                name: invoice.order.customerName,
                email: invoice.order.customerEmail,
                phone: invoice.order.customerPhone,
                address: invoice.order.customerAddress,
            },
            items: invoice.order.orderItems
        });

    } catch (error) {
        console.error('Get Invoice Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
