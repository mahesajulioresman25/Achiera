const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx3qor60000jp954nkba43d';

async function main() {
    try {
        await prisma.recipe.create({
            data: {
                name: 'Test',
                brand: { connect: { id: BRAND_ID } },
                __list_all_fields: true
            }
        });
    } catch (e) {
        console.log(e.message);
    }
}

main().finally(() => prisma.$disconnect());
