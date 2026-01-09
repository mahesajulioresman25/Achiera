import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDummyBrands() {
    console.log('🧹 Starting cleanup of dummy brands...\n');

    // Define the brands to KEEP
    const brandsToKeep = [
        'achiera',
        'rasa-ibu',
        'merch',
        'it-solutions'
    ];

    console.log('📋 Brands to keep:');
    brandsToKeep.forEach(slug => console.log(`   - ${slug}`));
    console.log('');

    try {
        // 1. Get all brands
        const allBrands = await prisma.brand.findMany({
            select: {
                id: true,
                slug: true,
                name: true
            }
        });

        console.log(`📊 Total brands in database: ${allBrands.length}\n`);

        // 2. Find brands to delete
        const brandsToDelete = allBrands.filter(
            brand => !brandsToKeep.includes(brand.slug)
        );

        if (brandsToDelete.length === 0) {
            console.log('✅ No dummy brands found. Database is clean!');
            return;
        }

        console.log(`🗑️  Found ${brandsToDelete.length} dummy brands to delete:\n`);
        brandsToDelete.forEach(brand => {
            console.log(`   - ${brand.name} (${brand.slug})`);
        });
        console.log('');

        const brandIdsToDelete = brandsToDelete.map(b => b.id);

        console.log('⚠️  Deleting all related data first...\n');

        // 3. Delete all related data in correct order (respecting foreign keys)

        // First, get all warehouses for these brands
        const warehousesToDelete = await prisma.warehouse.findMany({
            where: { brandId: { in: brandIdsToDelete } },
            select: { id: true }
        });
        const warehouseIds = warehousesToDelete.map(w => w.id);

        // Delete InventoryBatches (depends on warehouse)
        if (warehouseIds.length > 0) {
            const deletedBatches = await prisma.inventoryBatch.deleteMany({
                where: { warehouseId: { in: warehouseIds } }
            });
            console.log(`   ✓ Deleted ${deletedBatches.count} inventory batches`);

            // Delete StockMutations (depends on warehouse)
            const deletedMutations = await prisma.stockMutation.deleteMany({
                where: { warehouseId: { in: warehouseIds } }
            });
            console.log(`   ✓ Deleted ${deletedMutations.count} stock mutations`);
        }

        // Delete UserBrandRoles
        const deletedUserRoles = await prisma.userBrandRole.deleteMany({
            where: { brandId: { in: brandIdsToDelete } }
        });
        console.log(`   ✓ Deleted ${deletedUserRoles.count} user brand roles`);

        // Delete Orders
        const deletedOrders = await prisma.order.deleteMany({
            where: { brandId: { in: brandIdsToDelete } }
        });
        console.log(`   ✓ Deleted ${deletedOrders.count} orders`);

        // Delete Warehouses
        const deletedWarehouses = await prisma.warehouse.deleteMany({
            where: { brandId: { in: brandIdsToDelete } }
        });
        console.log(`   ✓ Deleted ${deletedWarehouses.count} warehouses`);

        // Get all ledger accounts for these brands
        const ledgerAccountsToDelete = await prisma.ledgerAccount.findMany({
            where: { brandId: { in: brandIdsToDelete } },
            select: { id: true }
        });
        const ledgerAccountIds = ledgerAccountsToDelete.map(a => a.id);

        // Delete JournalEntries (depends on ledger accounts)
        if (ledgerAccountIds.length > 0) {
            const deletedJournalEntries = await prisma.journalEntry.deleteMany({
                where: { accountId: { in: ledgerAccountIds } }
            });
            console.log(`   ✓ Deleted ${deletedJournalEntries.count} journal entries`);
        }

        // Delete Ledger Accounts
        const deletedLedgerAccounts = await prisma.ledgerAccount.deleteMany({
            where: { brandId: { in: brandIdsToDelete } }
        });
        console.log(`   ✓ Deleted ${deletedLedgerAccounts.count} ledger accounts`);

        // Delete Categories (this will cascade delete products and variants)
        const deletedCategories = await prisma.frozenCategory.deleteMany({
            where: { brandId: { in: brandIdsToDelete } }
        });
        console.log(`   ✓ Deleted ${deletedCategories.count} categories (and their products)`);

        console.log('');

        // 4. Finally, delete the brands
        const result = await prisma.brand.deleteMany({
            where: {
                id: { in: brandIdsToDelete }
            }
        });

        console.log(`✅ Successfully deleted ${result.count} dummy brands!\n`);

        // 5. Verify remaining brands
        const remainingBrands = await prisma.brand.findMany({
            select: {
                id: true,
                slug: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log(`📋 Remaining brands (${remainingBrands.length}):\n`);
        remainingBrands.forEach(brand => {
            console.log(`   ✓ ${brand.name} (${brand.slug})`);
        });

        console.log('\n🎉 Cleanup completed successfully!');
        console.log('\n⚠️  IMPORTANT: Please logout and login again to refresh your session!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupDummyBrands()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
