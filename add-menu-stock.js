const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    console.log('--- ADDING MENU STOCK BATCHES FOR RASA IBU ---');

    // 1. Get default warehouse
    const wh = await prisma.warehouse.findFirst({
        where: { brandId: BRAND_ID, isDefault: true }
    });

    if (!wh) {
        console.error('ERROR: No default warehouse found for Rasa Ibu!');
        return;
    }

    console.log(`Using Warehouse: ${wh.name} (${wh.id})`);

    // 2. Get all menu items (Finished Goods)
    const products = await prisma.frozenProduct.findMany({
        where: {
            category: { brandId: BRAND_ID },
            inventoryType: 'FINISHED_GOOD'
        },
        include: { variants: true }
    });

    console.log(`Found ${products.length} menu items.`);

    for (const p of products) {
        for (const v of p.variants) {
            console.log(`Seeding stock for ${p.name} (${v.sku})...`);

            // Upsert batch to avoid double seeding if run twice
            const batchCode = `INIT-${v.sku}`;
            const existingBatch = await prisma.inventoryBatch.findFirst({
                where: { variantId: v.id, warehouseId: wh.id, batchCode }
            });

            if (!existingBatch) {
                await prisma.inventoryBatch.create({
                    data: {
                        variant: { connect: { id: v.id } },
                        warehouse: { connect: { id: wh.id } },
                        batchCode: batchCode,
                        quantity: 100, // Give 100 porsi each
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                    }
                });

                // Also update stockOnHand just in case
                await prisma.frozenVariant.update({
                    where: { id: v.id },
                    data: { stockOnHand: 100 }
                });

                console.log(`✅ Batch created for ${v.sku}`);
            } else {
                console.log(`⚠️ Batch already exists for ${v.sku}, skipping.`);
            }
        }
    }

    console.log('--- MENU STOCK SEEDING COMPLETED ---');
}

main().finally(() => prisma.$disconnect());
