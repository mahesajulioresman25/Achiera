import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏗️ Restoring Default Warehouse & Inventory for Rasa Ibu...');

    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.error('❌ Brand "rasa-ibu" not found. Please run seed-rasa-ibu.ts first.');
        return;
    }

    // 1. Create Default Warehouse
    const warehouse = await prisma.warehouse.upsert({
        where: {
            brandId_name: {
                brandId: brand.id,
                name: 'Dapur Utama'
            }
        },
        update: {},
        create: {
            brandId: brand.id,
            name: 'Dapur Utama',
            address: 'Jakarta, Indonesia',
            isDefault: true
        }
    });

    console.log(`✅ Default Warehouse ready: ${warehouse.name} (${warehouse.id})`);

    // 2. Add Initial Batch for Sample Product
    const variant = await prisma.frozenVariant.findFirst({
        where: { sku: 'SAMPLE-V1' }
    });

    if (variant) {
        // Create initial batch so checkout doesn't fail on stock
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await prisma.inventoryBatch.create({
            data: {
                warehouseId: warehouse.id,
                variantId: variant.id,
                batchCode: 'BATCH-INIT-001',
                quantity: 100,
                expiryDate: expiryDate,
                receivedAt: new Date()
            }
        });

        // Ensure variant stockOnHand is synced
        await prisma.frozenVariant.update({
            where: { id: variant.id },
            data: { stockOnHand: 100 }
        });

        console.log(`✅ Initial stock batch (100 units) added for: ${variant.name}`);
    } else {
        console.warn('⚠️ Sample variant (SAMPLE-V1) not found. Skipping batch creation.');
    }

    console.log('\n🎉 Warehouse & Stock restoration completed!');
}

main()
    .catch((e) => {
        console.error('❌ Restoration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
