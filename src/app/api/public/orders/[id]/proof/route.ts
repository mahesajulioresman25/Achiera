import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const resolvedParams = await params;
        const { id } = resolvedParams;

        // Verify order exists
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get('proof') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type (images only)
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate filename
        const filename = `${order.invoiceNo}-proof-${Date.now()}.${file.name.split('.').pop()}`;

        // Upload to Supabase Storage (bucket: 'uploads')
        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(`proofs/${filename}`, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(`proofs/${filename}`);

        const paymentType = (formData.get('paymentType') as string) || 'DP';
        const destinationBankId = formData.get('destinationBankId') as string | null;
        const sourceBankName = formData.get('sourceBankName') as string | null;

        console.log(`[ProofUpload] Proceeding with ${paymentType} for order ${order.invoiceNo}`);

        // Determine Payment amount and type
        let amount = Number(order.total) * 0.5;
        let newStatus = order.status;
        let logMessage = 'Payment proof uploaded by customer';

        if (paymentType === 'QRIS') {
            amount = Number(order.total);
            newStatus = 'MENUNGGU_VERIFIKASI_QRIS';
            logMessage = 'Bukti pembayaran QRIS diunggah oleh pelanggan';
        }

        // Validate Status for Enum (OrderStatusLog)
        const validLogStatuses = [
            'DIPESAN', 'MENUNGGU_VERIFIKASI_QRIS', 'DIBAYAR',
            'DISIAPKAN', 'DIKIRIM', 'SELESAI', 'CANCELLED'
        ];
        const safeLogStatus = validLogStatuses.includes(newStatus) ? newStatus : 'DIPESAN';

        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: amount,
                type: paymentType,
                proofPath: publicUrl,
                destinationBankId: (destinationBankId && destinationBankId !== 'undefined') ? destinationBankId : undefined,
                sourceBankName: sourceBankName || undefined,
                isVerified: false
            }
        });

        // Update Order Status if it's QRIS
        if (paymentType === 'QRIS') {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: newStatus }
            });
        }

        await prisma.orderStatusLog.create({
            data: {
                orderId: order.id,
                status: safeLogStatus as any,
                message: logMessage
            }
        });

        // Notify Admin (Async)
        try {
            const { EmailService } = await import('@/lib/services/EmailService');
            await EmailService.sendAdminAlert(
                `Bukti Pembayaran Baru: ${order.invoiceNo}`,
                `Pelanggan baru saja mengunggah bukti pembayaran untuk invoice ${order.invoiceNo}.\n\nSilakan cek di dashboard admin.`
            );
            console.log(`[UploadProof] Notified admin via email about proof for ${order.invoiceNo}`);
        } catch (e) {
            console.error('[UploadProof] Email notification error:', e);
        }

        return NextResponse.json({ success: true, path: publicUrl });

    } catch (error: any) {
        console.error('CRITICAL: Upload proof error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
