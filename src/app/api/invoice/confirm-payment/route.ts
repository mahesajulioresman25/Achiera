
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceNumber } = body;

        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber },
            include: { order: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { invoiceNumber },
            data: {
                paymentStatus: 'PAID',
                watermarkStatus: 'PAID',
                paidAt: new Date()
            }
        });

        // Update Parent Order
        await prisma.order.update({
            where: { id: invoice.orderId },
            data: {
                status: 'DIBAYAR',
                statusLogs: {
                    create: {
                        status: 'DIBAYAR',
                        message: `Invoice ${invoiceNumber} confirmed manual payment`
                    }
                }
            }
        });

        // Send Notification
        try {
            // Award Loyalty Points
            if (invoice.order) {
                const { processOrderLoyalty } = await import('@/lib/actions/rasa-ibu/businessIntelligence');
                await processOrderLoyalty(
                    invoice.order.brandId || '',
                    invoice.order.customerPhone || '',
                    invoice.order.customerName || 'Bunda',
                    Number(invoice.order.total),
                    invoice.order.id
                );
            }

            const { EmailService } = await import('@/lib/services/EmailService');
            await EmailService.sendStatusUpdate(invoice.order as any, 'DIBAYAR');
        } catch (e) {
            console.error('Email Notification failed', e);
        }

        return NextResponse.json({ success: true, invoice: updatedInvoice });

    } catch (error) {
        console.error('Confirm Payment Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
