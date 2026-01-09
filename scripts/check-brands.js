const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Brand Check ---');
    const brands = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true
        }
    });
    console.log(JSON.stringify(brands, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
