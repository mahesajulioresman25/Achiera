
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const variantId = 'cmk99tn2a0002e4f26iahfoqe'; // The "test" variant
    const brandId = 'cmk5kbexl0000q34bzq02mknj';

    console.log('Restoring missing batch for Phantom Stock...');

    // 1. Get default warehouse
    const warehouse = await prisma.warehouse.findFirst({
        where: { brandId, isDefault: true }
    });

    if (!warehouse) throw new Error('Default warehouse not found');

    // 2. Create the missing batch
    const batch = await prisma.inventoryBatch.create({
        data: {
            warehouseId: warehouse.id,
            variantId: variantId,
            batchCode: `RESTORE-${Date.now()}`,
            quantity: 1, // Restoring the 1 unit seen in Pantry
            receivedAt: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
            // NOTE: We do NOT pass brandId here because we are using raw Prisma client 
            // and we want to bypass the middleware check for this manual fix 
            // OR we mimic the middleware's expectation if it's running.
            // But since this is a script, middleware might not be active unless we import it.
            // Actually, the middleware is global in Next.js, but here in tsx script? 
            // Usually tsx runs directly against DB without app middleware unless imported.
            // However, to be safe and consistent with schema, we rely on relation.
        }
    });

    console.log(`Restored Batch: ${batch.batchCode} in ${warehouse.name}`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
