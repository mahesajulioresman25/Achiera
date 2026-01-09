
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix param type for Next.js 15+
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                payments: {
                    include: { destinationBank: true }
                },
                statusLogs: { orderBy: { createdAt: 'desc' } },
                orderItems: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Failed to fetch order detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await req.json();
        const { status, paymentVerified, paymentAmount } = body;

        // Update logic:
        // 1. If status change, add log
        // 2. If paymentVerified, update payment record or create one

        const updateData: any = {};

        if (status) {
            updateData.status = status;
            updateData.statusLogs = {
                create: {
                    status: status,
                    message: `Status updated to ${status} by Admin`
                }
            };
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: updateData,
            include: { statusLogs: true }
        });

        // Handle Payment Verification (Simplified for now)
        if (paymentVerified) {
            const { paymentType } = body; // 'DP' or 'FINAL'

            await prisma.payment.create({
                data: {
                    orderId: id,
                    amount: paymentAmount || updatedOrder.subtotal,
                    type: paymentType || 'DP',
                    isVerified: true,
                    verifiedAt: new Date()
                }
            });

            // Auto update status logic
            let nextStatus = '';
            let logMessage = '';

            if (updatedOrder.status === 'WAITING_PAYMENT') {
                nextStatus = 'DIBAYAR';
                logMessage = 'DP Verified manually';
            } else if (updatedOrder.status === 'WAITING_FINAL_PAYMENT') {
                nextStatus = 'DIKIRIM';
                logMessage = 'Final Payment Verified. Order marked as Shipped.';
            }

            if (nextStatus) {
                await prisma.order.update({
                    where: { id },
                    data: {
                        status: nextStatus,
                        statusLogs: { create: { status: nextStatus as any, message: logMessage } }
                    }
                });
            }
        }

        // Notify Customer (Async)
        if (status || paymentVerified) {
            try {
                const { EmailService } = await import('@/lib/services/EmailService');
                const finalStatus = status || 'DIBAYAR';
                await EmailService.sendStatusUpdate(updatedOrder as any, finalStatus);
            } catch (e) {
                console.error('Email Notification failed', e);
            }
        }

        return NextResponse.json({ success: true, order: updatedOrder });

    } catch (error) {
        console.error('Failed to update order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
