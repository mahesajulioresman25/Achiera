
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStock() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) return;

    const warehouse = await prisma.warehouse.findFirst({ where: { brandId: brand.id, isDefault: true } });
    if (!warehouse) return;

    const variants = await prisma.frozenVariant.findMany({
        where: { product: { category: { brandId: brand.id } } },
        include: { batches: true }
    });

    for (const v of variants) {
        const whBatchTotal = v.batches
            .filter((b: any) => b.warehouseId === warehouse.id && !b.isExpired)
            .reduce((sum: number, b: any) => sum + b.quantity, 0);

        if (v.stockOnHand !== whBatchTotal) {
            console.log(`MISMATCH: ${v.name}`);
            console.log(`  ID: ${v.id}`);
            console.log(`  Aggregate stockOnHand: ${v.stockOnHand}`);
            console.log(`  Warehouse Batch Total: ${whBatchTotal}`);
            console.log(`  Diff: ${v.stockOnHand - whBatchTotal}`);
        }
    }
    await prisma.$disconnect();
}

debugStock().catch(console.error);
