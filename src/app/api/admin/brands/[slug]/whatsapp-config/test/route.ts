import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { waEngine } from '@/lib/whatsapp/engine';

export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { phone, config } = await req.json();
        const brand = await prisma.brand.findUnique({
            where: { slug: params.slug },
            select: { id: true, name: true }
        });

        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        // Push test message to queue
        // We bypass the global enabled check for testing purposes?
        // No, let's keep it safe. If global is off, it won't send.

        await (prisma as any).whatsAppQueue.create({
            data: {
                brandId: brand.id,
                phone: phone,
                text: `🔒 *TEST KONEKSI WHATSAPP*\n\nHalo! Ini adalah pesan ujicoba konfigurasi WhatsApp untuk brand *${brand.name}*.\n\nProvider: ${config.whatsappProvider}\nStatus: Aktif\n\nJika Kakak menerima pesan ini, berarti integrasi sudah berjalan dengan benar. ✅`,
                priority: 1,
                status: 'PENDING',
                metadata: { type: 'test_connection' }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[WA_TEST_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
