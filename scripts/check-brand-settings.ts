
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Brand Settings for rasa-ibu...');
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: {
            id: true,
            paymentSettings: true
        }
    });

    if (!brand) {
        console.log('Brand not found!');
    } else {
        console.log('Payment Settings:', JSON.stringify(brand.paymentSettings, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
