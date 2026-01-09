const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brands = await prisma.brand.findMany({
        include: {
            _count: {
                select: { frozenCategories: true, orders: true }
            }
        }
    });
    console.log(JSON.stringify(brands, null, 2));
}

main().finally(() => prisma.$disconnect());
