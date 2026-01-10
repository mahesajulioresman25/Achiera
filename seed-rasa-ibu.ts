// Seed Rasa Ibu Brand
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRasaIbu() {
    console.log('🌱 Seeding Rasa Ibu brand to Production...\n');

    try {
        // Upsert Brand (Create if new, Update if exists)
        const rasaIbu = await prisma.brand.upsert({
            where: { slug: 'rasa-ibu' },
            update: {
                paymentSettings: {
                    enabledMethods: ['BANK_TRANSFER', 'E_WALLET', 'QRIS'],
                    bankAccounts: []
                }
            },
            create: {
                slug: 'rasa-ibu',
                name: 'Rasa Ibu',
                isActive: true,
                paymentSettings: {
                    enabledMethods: ['BANK_TRANSFER', 'E_WALLET', 'QRIS'],
                    bankAccounts: []
                }
            }
        });

        console.log('✅ Brand "Rasa Ibu" secured!');
        console.log(`   ID: ${rasaIbu.id}`);

        // Upsert Brand Config (The Visuals)
        const config = await prisma.brandConfig.upsert({
            where: { brandId: rasaIbu.id },
            update: {
                publicTitle: "Kapanpun Rindu Masakan Ibu.",
                heroTagline: "Hangatnya Meja Makan",
                heroCtaPrimary: "Lihat Menu Kami",
                philosophyTitle: "Kenapa Memilih Rasa Ibu?",
                subscriptionTitle: "Berlangganan Katering"
            },
            create: {
                brandId: rasaIbu.id,
                publicTitle: "Kapanpun Rindu Masakan Ibu.",
                heroTagline: "Hangatnya Meja Makan",
                heroCtaPrimary: "Lihat Menu Kami",
                philosophyTitle: "Kenapa Memilih Rasa Ibu?",
                subscriptionTitle: "Berlangganan Katering"
            }
        });

        console.log('✅ Brand Config updated successfully!');
        console.log('\n🎉 Seeding complete! Production DB is ready.\n');

    } catch (error) {
        console.error('❌ Error seeding brand:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedRasaIbu();
