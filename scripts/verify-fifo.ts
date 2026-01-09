import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("❄️ Starting FIFO Verification...");

    // 1. Setup Data
    const brand = await prisma.brand.upsert({
        where: { slug: 'frozen-test' },
        update: {},
        create: { slug: 'frozen-test', name: 'Frozen Test Brand' }
    });

    const category = await prisma.frozenCategory.create({
        data: {
            brandId: brand.id,
            name: 'Meats',
            slug: 'meats-' + Date.now(),
        }
    });

    const product = await prisma.frozenProduct.create({
        data: {
            categoryId: category.id,
            name: 'Wagyu Beef',
            slug: 'wagyu-' + Date.now(),
            storageType: 'FROZEN',
        }
    });

    const variant = await prisma.frozenVariant.create({
        data: {
            productId: product.id,
            name: '200g Steak',
            sku: 'WAGYU-200-' + Date.now(),
            price: 150000,
            weight: 200,
        }
    });

    console.log("✅ Product Created:", variant.sku);

    // 2. Add Inventory Batches (FIFO Setup)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const nextMonth = new Date(now.getTime() + 86400000 * 30);

    // Batch A: Expires Tomorrow (Should be picked FIRST)
    await prisma.inventoryBatch.create({
        data: {
            variantId: variant.id,
            batchCode: 'BATCH-OLD',
            quantity: 10,
            expiryDate: tomorrow,
        }
    });

    // Batch B: Expires Next Month (Should be picked LAST)
    await prisma.inventoryBatch.create({
        data: {
            variantId: variant.id,
            batchCode: 'BATCH-NEW',
            quantity: 20,
            expiryDate: nextMonth,
        }
    });

    console.log("✅ Inventory Batches Created (Old: 10, New: 20)");

    // 3. FIFO Logic Test
    // "Customer buys 15 items"
    // Should take 10 from BATCH-OLD, and 5 from BATCH-NEW.

    const requiredQty = 15;
    let remainingQty = requiredQty;

    // Query Batches Sorted by Expiry
    const batches = await prisma.inventoryBatch.findMany({
        where: {
            variantId: variant.id,
            quantity: { gt: 0 },
            isExpired: false,
        },
        orderBy: { expiryDate: 'asc' },
    });

    console.log("🔍 Found Batches:", batches.map(b => `${b.batchCode} (Exp: ${b.expiryDate.toISOString().split('T')[0]}, Qty: ${b.quantity})`));

    for (const batch of batches) {
        if (remainingQty <= 0) break;

        const take = Math.min(batch.quantity, remainingQty);
        console.log(`   -> Taking ${take} from ${batch.batchCode}`);

        remainingQty -= take;
    }

    if (remainingQty === 0) {
        console.log("✅ FIFO Allocation Success: Fulfilled order.");
    } else {
        console.error("❌ FIFO Allocation Failed: Not enough stock?");
    }

    // Cleanup
    await prisma.frozenProduct.delete({ where: { id: product.id } });
    await prisma.frozenCategory.delete({ where: { id: category.id } });
    // Brand might be used by others, keep it or delete if unique test
    await prisma.brand.delete({ where: { id: brand.id } });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
