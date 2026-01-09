
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStock() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) return console.log('Brand not found');

    const warehouse = await prisma.warehouse.findFirst({ where: { brandId: brand.id, isDefault: true } });
    console.log(`Default Warehouse: ${warehouse?.name} (${warehouse?.id})`);

    const variants = await prisma.frozenVariant.findMany({
        where: {
            product: {
                OR: [
                    { category: { brandId: brand.id } },
                    { inventoryCategory: { brandId: brand.id } }
                ]
            }
        },
        include: { batches: true }
    });

    console.log('\n--- STOCK LEVELS ---');
    for (const v of variants) {
        const batchTotal = v.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
        const whBatchTotal = v.batches
            .filter((b: any) => b.warehouseId === warehouse?.id && !b.isExpired)
            .reduce((sum: number, b: any) => sum + b.quantity, 0);

        console.log(`Variant: ${v.name}`);
        console.log(`  Aggregate stockOnHand: ${v.stockOnHand}`);
        console.log(`  Total Batch Sum (All WH): ${batchTotal}`);
        console.log(`  Total WH Batch Sum (Default WH, Non-Expired): ${whBatchTotal}`);

        if (v.stockOnHand !== whBatchTotal) {
            console.log(`  [!] MISMATCH found for Default Warehouse`);
        }
    }

    await prisma.$disconnect();
}

debugStock().catch(console.error);
