const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({
        where: { id: 'cmjx3qor60000jp954nkba43d' }
    });

    console.log('Brand found for ID "cmjx3qor60000jp954nkba43d":');
    console.log(JSON.stringify(brand, null, 2));
}

main().finally(() => prisma.$disconnect());
