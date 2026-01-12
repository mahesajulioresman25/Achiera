
import { PrismaClient, StockMutationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj';

    // 1. Get Default Warehouse
    const warehouse = await prisma.warehouse.findFirst({
        where: { brandId, isDefault: true }
    });
    if (!warehouse) throw new Error('Default warehouse not found');

    console.log(`Using Warehouse: ${warehouse.name} (${warehouse.id})`);

    // --- FIX 1: INGREDIENT "susu uht trial" ---
    const ingredientId = 'cmk9bdbjw000qlvwpgcj3sxn1';
    console.log(`\nFixing Ingredient: ${ingredientId}`);

    // Check if batch exists
    const ingBatchCount = await prisma.inventoryBatch.count({
        where: { variantId: ingredientId, quantity: { gt: 0 } }
    });

    if (ingBatchCount === 0) {
        console.log('- Creating missing batch for Ingredient...');
        const batchCode = `RESTORE-ING-${Date.now()}`;
        const qty = 1; // Assuming 1 unit is missing based on "Phantom" status (Aggr: 1, Batch: 0)

        await prisma.$transaction(async (tx) => {
            // Create Batch
            const batch = await tx.inventoryBatch.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: ingredientId,
                    batchCode,
                    quantity: qty,
                    receivedAt: new Date(),
                    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
                    // brandId: brandId // Only if schema has it, safe to omit based on previous knowledge
                }
            });

            // Create Mutation (Crucial for UI visibility)
            await tx.stockMutation.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: ingredientId,
                    type: StockMutationType.ADJUSTMENT,
                    quantity: qty,
                    batchCode,
                    notes: 'System Restore: Fix Phantom Stock',
                    createdBy: 'SYSTEM',
                    brandId // Middleware requires this, accessing via raw prisma but to be safe matched logic
                }
            });
        });
        console.log('- Ingredient Fixed.');
    } else {
        console.log('- Ingredient batch already exists (or fixed).');
    }

    // --- FIX 2: FINISHED GOOD "test" ---
    const productId = 'cmk99tn2a0002e4f26iahfoqe'; // "test" variant ID
    console.log(`\nFixing Finished Good: ${productId}`);

    // I already created a batch previously, but maybe NO mutation?
    const prodMutationCount = await prisma.stockMutation.count({
        where: { variantId: productId, warehouseId: warehouse.id }
    });

    if (prodMutationCount === 0) {
        console.log('- No mutations found for Finished Good. Creating backfill mutation...');

        // Find the batch I created
        const batch = await prisma.inventoryBatch.findFirst({
            where: { variantId: productId, warehouseId: warehouse.id }
        });

        if (batch) {
            await prisma.stockMutation.create({
                data: {
                    warehouseId: warehouse.id,
                    variantId: productId,
                    type: StockMutationType.ADJUSTMENT,
                    quantity: batch.quantity, // Match batch qty
                    batchCode: batch.batchCode,
                    notes: 'System Restore: link existing batch',
                    createdBy: 'SYSTEM',
                    brandId
                }
            });
            console.log('- Mutation created to link existing batch.');
        } else {
            console.log('- WARNING: Batch not found either? Did it expire or was deleted?');
        }
    } else {
        console.log('- Mutations exist.');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
