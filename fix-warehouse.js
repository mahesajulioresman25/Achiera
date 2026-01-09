const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    const warehouse = await prisma.warehouse.findFirst({
        where: { brandId: BRAND_ID }
    });

    if (warehouse) {
        await prisma.warehouse.update({
            where: { id: warehouse.id },
            data: { isDefault: true }
        });
        console.log(`Updated warehouse "${warehouse.name}" (ID: ${warehouse.id}) to be default.`);
    } else {
        console.log('No warehouse found for ID: ' + BRAND_ID);
    }
}

main().finally(() => prisma.$disconnect());
