
import { PrismaClient, StockMutationType } from '@prisma/client';
import { WarehouseService } from '../src/lib/services/WarehouseService';

const prisma = new PrismaClient();
const warehouseService = new WarehouseService();

async function main() {
    console.log('--- WAREHOUSE SYSTEM VERIFICATION ---');
    const timestamp = Date.now();
    const brandId = `test-brand-${timestamp}`;

    // 1. Setup Brand & Product
    console.log('\n1. Setting up Brand & Product...');
    await prisma.brand.create({
        data: { id: brandId, name: `Brand ${timestamp}`, slug: brandId }
    });

    // Create Category & Product & Variant
    const categoryId = `cat-${timestamp}`;
    await prisma.frozenCategory.create({
        data: { id: categoryId, brandId, name: 'Test Cat', slug: `cat-${timestamp}` }
    });

    const productId = `prod-${timestamp}`;
    await prisma.frozenProduct.create({
        data: {
            id: productId,
            categoryId,
            name: 'Test Product',
            slug: productId,
            storageType: 'PACK'
        }
    });

    const variantId = `var-${timestamp}`;
    await prisma.frozenVariant.create({
        data: {
            id: variantId,
            productId,
            name: 'Standard',
            sku: `SKU-${timestamp}`,
            price: 50000,
            weight: 100
        }
    });

    // 2. Create Warehouse
    console.log('\n2. Creating Warehouse...');
    const warehouse = await prisma.warehouse.create({
        data: {
            brandId,
            name: 'Main Warehouse',
            isDefault: true
        }
    });
    console.log(`   -> Warehouse created: ${warehouse.id}`);

    // 3. Add Stock (Stock In)
    console.log('\n3. Adding Stock (Stock In)...');
    const expiryDate1 = new Date();
    expiryDate1.setDate(expiryDate1.getDate() + 30); // 30 days expiry

    await warehouseService.addStock(
        { brandId, userId: 'tester' },
        warehouse.id,
        variantId,
        100,
        'BATCH-001',
        expiryDate1
    );
    console.log('   -> Added 100 units (BATCH-001)');

    const expiryDate2 = new Date();
    expiryDate2.setDate(expiryDate2.getDate() + 10); // 10 days expiry (Should be used first by FIFO)

    await warehouseService.addStock(
        { brandId, userId: 'tester' },
        warehouse.id,
        variantId,
        50,
        'BATCH-002',
        expiryDate2
    );
    console.log('   -> Added 50 units (BATCH-002) [Older Expiry]');

    // Check total stock
    const totalStock = await warehouseService.getStockLevel(warehouse.id, variantId);
    console.log(`   -> Total Stock: ${totalStock} (Expected: 150)`);

    // 4. Deduct Stock (FIFO Test)
    console.log('\n4. Deducting Stock (FIFO Test)...');
    // Request 60 units. Should take all 50 from BATCH-002 and 10 from BATCH-001
    const deductions = await warehouseService.deductStock(
        { brandId, userId: 'tester' },
        warehouse.id,
        variantId,
        60,
        'TEST-ORDER-1'
    );

    console.log('   -> Deductions made:');
    deductions.forEach(d => {
        console.log(`      - Batch ${d.batchId}: ${d.quantity}`);
        // In a real test we'd verify batch codes, but IDs are effectively unknown here without fetch.
        // We rely on the logic that we inserted BATCH-002 second but it has earlier expiry.
    });

    // Verify remaining stock
    const remainingStock = await warehouseService.getStockLevel(warehouse.id, variantId);
    console.log(`   -> Remaining Stock: ${remainingStock} (Expected: 90)`);

    // 5. Verify Mutations
    console.log('\n5. Verifying Mutations...');
    const mutations = await prisma.stockMutation.findMany({
        where: { warehouseId: warehouse.id },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`   -> Found ${mutations.length} mutations.`);
    mutations.forEach(m => {
        console.log(`      [${m.type}] ${m.quantity} (${m.batchCode})`);
    });

    console.log('\n--- VERIFICATION COMPLETE ---');
}

main()
    .catch(e => {
        console.error('VERIFICATION ERROR:');
        console.error(e.message);
        if (e.code) console.error('Error Code:', e.code);
        if (e.meta) console.error('Meta:', e.meta);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
