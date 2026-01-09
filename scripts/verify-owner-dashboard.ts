import { prisma } from "../src/lib/prisma";
import { OwnerService } from "../src/lib/services/OwnerService";

async function main() {
    console.log("📊 Starting Owner Dashboard verification...");

    // 1. Setup Brands
    const brandA = await prisma.brand.upsert({
        where: { slug: 'dash-test-a' },
        update: {},
        create: { slug: 'dash-test-a', name: 'Brand A (Merch)' }
    });

    const brandB = await prisma.brand.upsert({
        where: { slug: 'dash-test-b' },
        update: {},
        create: { slug: 'dash-test-b', name: 'Brand B (IT)' }
    });

    // 2. Setup Ledger Accounts (Revenue & Cash)
    // Brand A
    const revA = await prisma.ledgerAccount.create({
        data: { brandId: brandA.id, code: '4000-A', name: 'Revenue A', type: 'REVENUE' }
    });
    const cashA = await prisma.ledgerAccount.create({
        data: { brandId: brandA.id, code: '1000-CASH-A', name: 'Cash A', type: 'ASSET' }
    });

    // Brand B
    const revB = await prisma.ledgerAccount.create({
        data: { brandId: brandB.id, code: '4000-B', name: 'Revenue B', type: 'REVENUE' }
    });
    const cashB = await prisma.ledgerAccount.create({
        data: { brandId: brandB.id, code: '1000-CASH-B', name: 'Cash B', type: 'ASSET' }
    });

    // 3. Insert Transactions
    // Brand A: Sell $1000
    await prisma.journalTransaction.create({
        data: {
            brandId: brandA.id,
            description: 'Brand A Sale',
            entries: {
                create: [
                    { accountId: cashA.id, debit: 1000, credit: 0 },
                    { accountId: revA.id, debit: 0, credit: 1000 }
                ]
            }
        }
    });

    // Brand B: Sell $500
    await prisma.journalTransaction.create({
        data: {
            brandId: brandB.id,
            description: 'Brand B Sale',
            entries: {
                create: [
                    { accountId: cashB.id, debit: 500, credit: 0 },
                    { accountId: revB.id, debit: 0, credit: 500 }
                ]
            }
        }
    });

    console.log("✅ Seed Data Created: Brand A ($1000), Brand B ($500)");

    // 4. Verify Service Aggregation
    const service = new OwnerService();

    // Test 1: Global Stats
    const globalStats = await service.getGlobalStats();
    console.log("--- Global Stats ---");
    console.log("Revenue:", globalStats.totalRevenue); // Expect 1500
    console.log("Cash:", globalStats.totalCash);       // Expect 1500

    if (globalStats.totalRevenue === 1500 && globalStats.totalCash === 1500) {
        console.log("✅ Global Aggregation Passed");
    } else {
        console.error("❌ Global Aggregation Failed");
    }

    // Test 2: Brand Comparison
    const comparison = await service.getBrandComparison();
    console.log("\n--- Brand Comparison ---");
    const compA = comparison.find(c => c.slug === 'dash-test-a');
    const compB = comparison.find(c => c.slug === 'dash-test-b');

    if (compA?.revenue === 1000 && compB?.revenue === 500) {
        console.log("✅ Brand Per-Unit Aggregation Passed");
    } else {
        console.error("❌ Brand Aggregation Failed", { compA, compB });
    }

    // Cleanup
    await prisma.brand.deleteMany({ where: { slug: { in: ['dash-test-a', 'dash-test-b'] } } });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
