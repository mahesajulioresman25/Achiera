import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    const banks = await prisma.bankAccount.findMany({
        where: { isActive: true }
    });
    console.log('Active Banks:', JSON.stringify(banks, null, 2));

    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });
    console.log('Rasa Ibu Payment Settings:', JSON.stringify(brand?.paymentSettings, null, 2));
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
