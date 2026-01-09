// Check Brand Payment Settings Script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentSettings() {
    const slug = 'rasa-ibu';
    console.log(`🔍 checking database for brand: ${slug}...\n`);

    try {
        const brand = await prisma.brand.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                paymentSettings: true,
                bankAccounts: true
            }
        });

        if (brand) {
            console.log('✅ Brand FOUND!');
            console.log(`   Name: ${brand.name}`);
            console.log('   Payment Settings (JSON):', JSON.stringify(brand.paymentSettings, null, 2));
            console.log('   Bank Accounts Table:', JSON.stringify(brand.bankAccounts, null, 2));
        } else {
            console.log('❌ Brand NOT FOUND in database.');
        }

    } catch (error) {
        console.error('❌ Error checking brand:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPaymentSettings();
