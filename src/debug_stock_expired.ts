
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStockExpired() {
    const ids = ['cmjpp0csy0016r9o1pn7wms8x', 'cmjvgt5fs004rjgias38cdgla'];

    for (const id of ids) {
        const v = await prisma.frozenVariant.findUnique({
            where: { id },
            include: { batches: true }
        });

        if (v) {
            console.log(`Variant: ${v.name} (${v.id})`);
            console.log(`  Aggregate stockOnHand: ${v.stockOnHand}`);
            console.log(`  Batches: ${v.batches.length}`);
            for (const b of v.batches) {
                console.log(`    Batch: ${b.batchCode}, Qty: ${b.quantity}, Expired: ${b.isExpired}, Expiry: ${b.expiryDate}`);
            }
        }
    }
    await prisma.$disconnect();
}

debugStockExpired().catch(console.error);
