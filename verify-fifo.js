
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Starting FIFO Verification ---");

    const brand = await prisma.brand.findFirst({ where: { slug: 'rasa-ibu' } });
    if (!brand) throw new Error("Brand 'rasa-ibu' not found");

    const brandId = brand.id;
    const variantId = 'cmjj9fnqc0008cooxdaqgangm'; // Reguler variant found earlier

    // 1. Setup: Clear existing batches for this variant to have a clean test
    await prisma.inventoryBatch.deleteMany({ where: { variantId } });

    const warehouse = await prisma.warehouse.findFirst({ where: { brandId: brand.id, isDefault: true } });
    if (!warehouse) throw new Error("Warehouse not found for brand");

    console.log(`Setting up test for variant: ${variantId} in warehouse: ${warehouse.name}`);

    // 2. Create two batches
    // Batch A: Expiring tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const batchA = await prisma.inventoryBatch.create({
        data: {
            warehouseId: warehouse.id,
            variantId,
            batchCode: 'TEST-FIFO-A',
            quantity: 10,
            expiryDate: tomorrow,
            receivedAt: new Date()
        }
    });

    // Batch B: Expiring in a year
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const batchB = await prisma.inventoryBatch.create({
        data: {
            warehouseId: warehouse.id,
            variantId,
            batchCode: 'TEST-FIFO-B',
            quantity: 10,
            expiryDate: nextYear,
            receivedAt: new Date()
        }
    });

    console.log(`Created Batch A (Expiry: ${tomorrow.toDateString()}, Qty: 10)`);
    console.log(`Created Batch B (Expiry: ${nextYear.toDateString()}, Qty: 10)`);

    // 3. Update aggregate stock
    await prisma.frozenVariant.update({
        where: { id: variantId },
        data: { stockOnHand: 20 }
    });

    // 4. Simulate deduction logic
    console.log("\nSimulating deduction of 5 units...");

    const batches = await prisma.inventoryBatch.findMany({
        where: { warehouseId: warehouse.id, variantId, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' }
    });

    let remaining = 5;
    for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        await prisma.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } }
        });
        console.log(`Deducted ${deduct} from batch ${batch.batchCode}`);
        remaining -= deduct;
    }

    // 5. Check results
    const finalA = await prisma.inventoryBatch.findUnique({ where: { id: batchA.id } });
    const finalB = await prisma.inventoryBatch.findUnique({ where: { id: batchB.id } });

    console.log(`\nFinal Batch A Qty: ${finalA.quantity} (Expected: 5)`);
    console.log(`Final Batch B Qty: ${finalB.quantity} (Expected: 10)`);

    if (finalA.quantity === 5 && finalB.quantity === 10) {
        console.log("\n✅ FIFO VERIFICATION SUCCESS!");
    } else {
        console.log("\n❌ FIFO VERIFICATION FAILED!");
    }
}

main()
    .catch(e => {
        console.error("Verification failed:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
