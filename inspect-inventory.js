
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const warehouses = await prisma.warehouse.findMany();
    console.log('--- WAREHOUSES ---');
    console.log(JSON.stringify(warehouses, null, 2));

    const batches = await prisma.inventoryBatch.findMany({
        include: {
            variant: {
                select: { name: true }
            }
        }
    });
    console.log('\n--- BATCHES ---');
    console.log(JSON.stringify(batches, null, 2));

    const variants = await prisma.frozenVariant.findMany({
        select: { id: true, name: true, stockOnHand: true }
    });
    console.log('\n--- VARIANTS STOCK ---');
    console.log(JSON.stringify(variants, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
