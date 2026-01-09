const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    console.log('Brand found for slug "rasa-ibu":');
    console.log(JSON.stringify(brand, null, 2));
}

main().finally(() => prisma.$disconnect());
