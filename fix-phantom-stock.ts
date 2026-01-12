
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 FIXING PHANTOM STOCK...\n');

    const variantId = 'cmk9bdbjw000qlvwpgcj3sxn1';

    // 1. Calculate Real Stock from Batches
    const batches = await prisma.inventoryBatch.findMany({
        where: {
            variantId,
            quantity: { gt: 0 },
            isExpired: false
        }
    });

    const realStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    console.log(`✅ Calculated Real Stock (from ${batches.length} batches): ${realStock}`);

    // 2. Get Current Phantom Stock
    const variant = await prisma.frozenVariant.findUnique({ where: { id: variantId } });
    console.log(`⚠️ Current Global Stock: ${variant?.stockOnHand}`);

    if (variant && variant.stockOnHand !== realStock) {
        console.log(`🔄 MISMATCH DETECTED. Sycing to ${realStock}...`);

        await prisma.frozenVariant.update({
            where: { id: variantId },
            data: { stockOnHand: realStock }
        });

        console.log(`✅ FIXED. New Stock: ${realStock}`);
    } else {
        console.log(`✅ Stock is already consistent.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
