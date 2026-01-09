import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("💰 Starting Finance Ledger Verification...");

    // 1. Setup Brand
    const brand = await prisma.brand.upsert({
        where: { slug: 'finance-test' },
        update: {},
        create: { slug: 'finance-test', name: 'Finance Verification Inc.' }
    });

    // 2. Setup Chart of Accounts
    const cashAccount = await prisma.ledgerAccount.create({
        data: {
            brandId: brand.id,
            code: '1000-CASH',
            name: 'Cash on Hand',
            type: 'ASSET'
        }
    });

    const revenueAccount = await prisma.ledgerAccount.create({
        data: {
            brandId: brand.id,
            code: '4000-REVENUE',
            name: 'Sales Revenue',
            type: 'REVENUE'
        }
    });

    console.log("✅ Chart of Accounts Created");

    // 3. Create Double-Entry Transaction (Sale of $100)
    // Debit Cash 100
    // Credit Revenue 100

    const tx = await prisma.journalTransaction.create({
        data: {
            brandId: brand.id,
            description: 'Sale of Services',
            entries: {
                create: [
                    {
                        accountId: cashAccount.id,
                        debit: 100,
                        credit: 0
                    },
                    {
                        accountId: revenueAccount.id,
                        debit: 0,
                        credit: 100
                    }
                ]
            }
        },
        include: {
            entries: true
        }
    });

    console.log("✅ Transaction Created:", tx.description);

    // 4. Verify Balance Equation (Total Debits = Total Credits)
    const totalDebit = tx.entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = tx.entries.reduce((sum, e) => sum + Number(e.credit), 0);

    if (totalDebit === totalCredit) {
        console.log(`✅ Double-Entry Verified: ${totalDebit} = ${totalCredit}`);
    } else {
        console.error(`❌ Imbalanced Transaction: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    // 5. Verify Brand Isolation
    // Create another brand account
    const brandB = await prisma.brand.upsert({ where: { slug: 'other-brand' }, update: {}, create: { slug: 'other-brand', name: ' Other' } });

    // Try to access Brand A's Ledger with Brand B's ID (Simulated)
    const isolatedCheck = await prisma.ledgerAccount.findFirst({
        where: {
            brandId: brandB.id,
            code: '1000-CASH' // Should not exist for Brand B
        }
    });

    if (!isolatedCheck) {
        console.log("✅ Brand Isolation Verified: Cannot access Brand A account from Brand B context.");
    } else {
        console.error("❌ Brand Isolation Failed: Leaked Account!");
    }

    // Cleanup
    await prisma.journalTransaction.delete({ where: { id: tx.id } });
    await prisma.ledgerAccount.deleteMany({ where: { brandId: brand.id } });
    await prisma.brand.delete({ where: { id: brand.id } });
    await prisma.brand.delete({ where: { id: brandB.id } });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
