import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.error('Brand "rasa-ibu" not found.');
        return;
    }

    console.log('Cleaning existing plans...');
    await prisma.subscriptionPlan.deleteMany({ where: { brandId: brand.id } });

    const plans = [
        {
            brandId: brand.id,
            name: 'Paket Rantau Mingguan',
            description: 'Lauk beku dikirim setiap 7 hari. Hemat waktu & stok terjaga.',
            price: 150000,
            interval: 'WEEKLY',
            features: [
                'Pengiriman Rutin 7 Hari Sekali',
                'Pilihan Menu Variatif',
                'Prioritas Stok'
            ],
            isActive: true
        },
        {
            brandId: brand.id,
            name: 'Paket Rantau Bulanan',
            description: 'Stok lauk untuk sebulan penuh. Harga lebih hemat!',
            price: 550000,
            interval: 'MONTHLY',
            features: [
                'Pengiriman Rutin 30 Hari Sekali',
                'Hemat Rp 50.000',
                'Konsultasi Menu Gratis',
                'Prioritas Stok'
            ],
            isActive: true
        }
    ];

    console.log('Seeding subscription plans...');

    for (const plan of plans) {
        await prisma.subscriptionPlan.create({
            data: plan
        });
    }

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
