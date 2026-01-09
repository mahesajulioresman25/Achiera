const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    const warehouses = await prisma.warehouse.findMany({
        where: { brandId: BRAND_ID }
    });

    console.log('Warehouses for Rasa Ibu:');
    warehouses.forEach(w => {
        console.log(`- ${w.name} (Default: ${w.isDefault})`);
    });
}

main().finally(() => prisma.$disconnect());
