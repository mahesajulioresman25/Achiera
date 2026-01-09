import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        // Verify order exists
        const order = await prisma.order.findUnique({
            where: { id },
            select: { id: true, invoiceNo: true, status: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Only allow cancellation for unpaid statuses
        const cancellableStatuses = ['DIPESAN', 'WAITING_PAYMENT', 'MENUNGGU_VERIFIKASI_QRIS'];
        if (!cancellableStatuses.includes(order.status)) {
            return NextResponse.json({
                error: `Order cannot be cancelled in status: ${order.status}`
            }, { status: 400 });
        }

        // Perform cancellation
        await prisma.$transaction([
            prisma.order.update({
                where: { id: order.id },
                data: { status: 'CANCELLED' }
            }),
            prisma.orderStatusLog.create({
                data: {
                    orderId: order.id,
                    status: 'CANCELLED',
                    message: 'Pesanan dibatalkan oleh pelanggan melalui halaman pelacakan.'
                }
            })
        ]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Cancel order error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
