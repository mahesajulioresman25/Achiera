
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brands = await prisma.brand.findMany();

    for (const brand of brands) {
        console.log(`Processing brand: ${brand.name} (${brand.slug})`);

        // 1. Ensure Default Warehouse
        let warehouse = await prisma.warehouse.findFirst({
            where: { brandId: brand.id, isDefault: true }
        });

        if (!warehouse) {
            console.log(`Creating default warehouse for ${brand.slug}`);
            warehouse = await prisma.warehouse.create({
                data: {
                    brandId: brand.id,
                    name: 'Gudang Utama',
                    isDefault: true,
                    address: 'Sentra Distribusi Utama'
                }
            });
        }

        // 2. Process Frozen Variants
        const variants = await prisma.frozenVariant.findMany({
            where: { stockOnHand: { gt: 0 } }
        });

        for (const variant of variants) {
            console.log(`Creating legacy batch for ${variant.name} (${variant.stockOnHand} units)`);

            // Create Inventory Batch
            await prisma.inventoryBatch.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: variant.id,
                    batchCode: 'LEGACY-INIT',
                    quantity: variant.stockOnHand,
                    receivedAt: new Date('2025-01-01'), // Fixed past date
                    expiryDate: new Date('2026-12-31'), // Far future
                    isExpired: false
                }
            });

            // Log Mutation
            await prisma.stockMutation.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: variant.id,
                    type: 'IN', // Use string since enum can be tricky in raw script
                    quantity: variant.stockOnHand,
                    batchCode: 'LEGACY-INIT',
                    notes: 'FIFO System Initialized from existing stock',
                    createdBy: 'SYSTEM-INIT'
                }
            });
        }
    }

    console.log('Initialization complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
