
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reconcileStock() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) return console.log('Brand not found');

    const warehouse = await prisma.warehouse.findFirst({ where: { brandId: brand.id, isDefault: true } });
    if (!warehouse) return console.log('Warehouse not found');

    const variants = await prisma.frozenVariant.findMany({
        where: { product: { category: { brandId: brand.id } } },
        include: { batches: true }
    });

    console.log(`Reconciling stock for ${brand.name}...`);

    for (const v of variants) {
        const batchTotal = v.batches
            .filter((b: any) => b.warehouseId === warehouse.id && !b.isExpired)
            .reduce((sum: number, b: any) => sum + b.quantity, 0);

        if (v.stockOnHand > 0 && batchTotal === 0) {
            console.log(`[RECONCILE] ${v.name}: Aggregate ${v.stockOnHand} units found with 0 batches. Creating recovery batch...`);

            await prisma.inventoryBatch.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: v.id,
                    batchCode: `RECON-SYNC-${Date.now().toString().slice(-6)}`,
                    quantity: v.stockOnHand,
                    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Default 6 months
                    receivedAt: new Date()
                }
            });
            console.log(`  Successfully created batch for ${v.stockOnHand} units.`);
        }
    }

    await prisma.$disconnect();
}

reconcileStock().catch(console.error);
