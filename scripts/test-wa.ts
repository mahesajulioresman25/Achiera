import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    const brand = await prisma.brand.findFirst();
    if (!brand) {
        console.error('No brand found in database');
        process.exit(1);
    }

    const testPhone = process.argv[2];
    if (!testPhone) {
        console.error('Usage: npx tsx scripts/test-wa.ts <phone_number>');
        process.exit(1);
    }

    try {
        await (prisma as any).whatsAppQueue.create({
            data: {
                brandId: brand.id,
                phone: testPhone,
                text: 'Halo Bunda! Ini adalah pesan tes dari Sistem Achiera (Anti-Ban Test). 🥘✨\n\nPesan ini membuktikan bahwa antrean WhatsApp sudah berjalan dengan aman.',
                priority: 1,
                status: 'PENDING',
                scheduledFor: new Date()
            }
        });
        console.log(`✅ Success: Test message enqueued for ${testPhone}`);
        console.log('The background processor will pick this up in ~10 seconds.');
    } catch (error) {
        console.error('❌ Error enqueuing message:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
