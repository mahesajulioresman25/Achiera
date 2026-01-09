
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Registering GrabFood Integration for Rasa Ibu...');

    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.error('❌ Brand Rasa Ibu not found!');
        process.exit(1);
    }

    const emailAddress = "achiera25.id@gmail.com";

    // Register GrabFood
    await prisma.emailIntegration.upsert({
        where: { id: 'grabfood-rasa-ibu' },
        update: {
            emailAddress,
            isActive: true
        },
        create: {
            id: 'grabfood-rasa-ibu',
            brandId: brand.id,
            platform: 'GRABFOOD',
            emailAddress,
            isActive: true
        }
    });
    console.log('✅ GrabFood Email Integration registered');

    console.log('\n🎉 Integration registered successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
