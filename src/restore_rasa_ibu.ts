import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreRasaIbu() {
    console.log('🚑 Restoring Rasa Ibu Brand...');

    try {
        const brand = await prisma.brand.upsert({
            where: { slug: 'rasa-ibu' },
            create: {
                slug: 'rasa-ibu',
                name: 'Rasa Ibu',
                isActive: true,
                paymentSettings: {
                    qrisEnabled: true,
                    qrisImageUrl: '/uploads/qris/cmjp1yznb0000lhwqnivhwhvt-1767370195914.jpg', // Path QRIS yang sudah verified sebelumnya
                    downPaymentPercentage: 50
                }
            },
            update: {
                name: 'Rasa Ibu',
                isActive: true
            }
        });

        console.log('✅ Brand Restored:', brand);

        // Langsung link ulang rekening bank (jika id bank masih ada)
        await prisma.$executeRaw`
            UPDATE bank_accounts 
            SET brandId = ${brand.id} 
            WHERE id = 'rasa-ibu-bca-main';
        `;
        console.log('✅ Bank Account re-linked to brand');

    } catch (error) {
        console.error('❌ Restore failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreRasaIbu();
