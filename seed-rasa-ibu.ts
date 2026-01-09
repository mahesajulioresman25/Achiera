// Seed Rasa Ibu Brand
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRasaIbu() {
    console.log('🌱 Seeding Rasa Ibu brand...\n');

    try {
        // Check if brand already exists
        const existing = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' }
        });

        if (existing) {
            console.log('✅ Brand "Rasa Ibu" already exists!');
            console.log(`   ID: ${existing.id}`);
            console.log(`   Name: ${existing.name}`);
            return;
        }

        // Create Rasa Ibu brand
        const rasaIbu = await prisma.brand.create({
            data: {
                slug: 'rasa-ibu',
                name: 'Rasa Ibu',
                isActive: true,
                paymentSettings: {
                    enabledMethods: ['BANK_TRANSFER', 'E_WALLET'],
                    bankAccounts: []
                }
            }
        });

        console.log('✅ Brand "Rasa Ibu" created successfully!');
        console.log(`   ID: ${rasaIbu.id}`);
        console.log(`   Slug: ${rasaIbu.slug}`);
        console.log(`   Name: ${rasaIbu.name}`);
        console.log(`   Active: ${rasaIbu.isActive}`);
        console.log('\n🎉 Seeding complete! You can now access /dashboard/rasa-ibu\n');

    } catch (error) {
        console.error('❌ Error seeding brand:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedRasaIbu();
