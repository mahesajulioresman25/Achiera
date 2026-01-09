const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brands = await prisma.brand.findMany({
        select: { id: true, slug: true, name: true }
    });
    brands.forEach(b => {
        console.log(`ID: "${b.id}" | Slug: "${b.slug}" | Name: "${b.name}"`);
    });
}

main().finally(() => prisma.$disconnect());
