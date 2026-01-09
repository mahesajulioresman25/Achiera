const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    const categories = await prisma.frozenCategory.findMany({
        where: { brandId: BRAND_ID }
    });

    console.log('Categories found for Rasa Ibu (correct ID):', categories.length);
    categories.forEach(c => console.log(`- ${c.name} (${c.slug})`));
}

main().finally(() => prisma.$disconnect());
