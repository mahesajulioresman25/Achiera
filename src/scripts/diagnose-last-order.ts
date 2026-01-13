
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('🔍 Starting Diagnosis...');

        // 1. Find Brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' }
        });

        if (!brand) {
            console.error('❌ Brand Rasa Ibu not found');
            return;
        }

        console.log(`✅ Brand Found: ${brand.name} (${brand.id})`);

        // 2. Find Last Order
        const lastOrder = await prisma.order.findFirst({
            where: { brandId: brand.id },
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: true
            }
        });

        if (!lastOrder) {
            console.log('❌ No orders found.');
            return;
        }

        console.log(`\n📋 Last Order: ${lastOrder.invoiceNo || lastOrder.id}`);
        console.log(`   Status: ${lastOrder.status}`);
        console.log(`   Created: ${lastOrder.createdAt.toISOString()}`);
        console.log(`   Items: ${lastOrder.orderItems.length}`);

        // 3. Analyze Items
        for (const item of lastOrder.orderItems) {
            console.log(`\n   🛒 Item: ${item.name} (Qty: ${item.quantity})`);
            console.log(`      Variant ID: ${item.frozenVariantId}`);

            if (item.frozenVariantId) {
                const variant = await prisma.frozenVariant.findUnique({
                    where: { id: item.frozenVariantId }
                });

                if (variant) {
                    console.log(`      📦 Current StockOnHand: ${variant.stockOnHand}`);

                    // Check Mutations
                    const mutations = await prisma.stockMutation.findMany({
                        where: {
                            variantId: variant.id,
                            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    });

                    console.log(`      📉 Recent Mutations: ${mutations.length}`);
                    mutations.forEach(m => {
                        console.log(`         - [${m.type}] Qty: ${m.quantity} | Ref: ${m.referenceId} | ${m.createdAt.toISOString()}`);
                    });

                    // Check Batches
                    const batches = await prisma.inventoryBatch.findMany({
                        where: { variantId: variant.id, quantity: { gt: 0 } }
                    });
                    const batchSum = batches.reduce((sum, b) => sum + b.quantity, 0);
                    console.log(`      📊 Batch Sum: ${batchSum} (Match: ${batchSum === variant.stockOnHand ? 'YES' : 'NO'})`);
                } else {
                    console.log(`      ❌ Variant not found in DB!`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
