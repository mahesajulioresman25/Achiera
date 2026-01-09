// Inspect Brand Payment Full Script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectPayment() {
    const slug = 'rasa-ibu';
    console.log(`🔍 Inspecting payment data for: ${slug}...\n`);

    try {
        const brand = await prisma.brand.findUnique({
            where: { slug },
            include: {
                bankAccounts: true
            }
        });

        if (brand) {
            console.log('✅ BRAND DATA:');
            console.log(`   ID: ${brand.id}`);
            console.log(`   Name: ${brand.name}`);
            console.log('---');
            console.log('📂 paymentSettings (JSON):');
            console.log(JSON.stringify(brand.paymentSettings, null, 2));
            console.log('---');
            console.log('🏦 Bank Accounts (Table):');
            if (brand.bankAccounts.length === 0) {
                console.log('   (Empty)');
            } else {
                brand.bankAccounts.forEach((acc, i) => {
                    console.log(`   [${i + 1}] ${acc.bankName} - ${acc.accountNumber} (${acc.accountHolder}) [Active: ${acc.isActive}]`);
                });
            }
        } else {
            console.log('❌ Brand not found.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectPayment();
