import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding dummy data for Consolidated Financial Statements...\n');

    // Get all brands
    const brands = await prisma.brand.findMany({
        where: { isActive: true }
    });

    if (brands.length === 0) {
        console.error('❌ No active brands found!');
        return;
    }

    console.log(`📊 Found ${brands.length} brands:\n`);
    brands.forEach(brand => {
        console.log(`  - ${brand.name} (${brand.slug})`);
    });

    // Get or create ledger accounts for each brand
    console.log('\n📝 Creating ledger accounts...\n');

    for (const brand of brands) {
        // Check if accounts exist
        const existingAccounts = await prisma.ledgerAccount.count({
            where: { brandId: brand.id }
        });

        if (existingAccounts > 0) {
            console.log(`  ✓ ${brand.name}: ${existingAccounts} accounts already exist`);
            continue;
        }

        // Create basic accounts
        await prisma.ledgerAccount.createMany({
            data: [
                // Assets
                { brandId: brand.id, code: '1000', name: 'Cash', type: 'ASSET' },
                { brandId: brand.id, code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
                { brandId: brand.id, code: '1200', name: 'Inventory', type: 'ASSET' },
                { brandId: brand.id, code: '1500', name: 'Fixed Assets', type: 'ASSET' },

                // Liabilities
                { brandId: brand.id, code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
                { brandId: brand.id, code: '2100', name: 'Loans Payable', type: 'LIABILITY' },

                // Equity
                { brandId: brand.id, code: '3000', name: 'Owner Equity', type: 'EQUITY' },
                { brandId: brand.id, code: '3100', name: 'Retained Earnings', type: 'EQUITY' },

                // Revenue
                { brandId: brand.id, code: '4000', name: 'Sales Revenue', type: 'REVENUE' },

                // COGS
                { brandId: brand.id, code: '5000', name: 'Cost of Goods Sold', type: 'COGS' },

                // Expenses
                { brandId: brand.id, code: '6000', name: 'Salaries Expense', type: 'EXPENSE' },
                { brandId: brand.id, code: '6100', name: 'Rent Expense', type: 'EXPENSE' },
                { brandId: brand.id, code: '6200', name: 'Utilities Expense', type: 'EXPENSE' },
                { brandId: brand.id, code: '6300', name: 'Marketing Expense', type: 'EXPENSE' },
            ]
        });

        console.log(`  ✓ ${brand.name}: Created 18 accounts`);
    }

    // Create journal entries for 2024
    console.log('\n💰 Creating journal entries for 2024...\n');

    const year = 2024;
    const revenueMultipliers = [1.0, 1.2, 0.8]; // Different revenue levels per brand

    for (let i = 0; i < brands.length; i++) {
        const brand = brands[i];
        const multiplier = revenueMultipliers[i] || 1.0;

        // Get accounts
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId: brand.id }
        });

        const cashAccount = accounts.find(a => a.code === '1000')!;
        const revenueAccount = accounts.find(a => a.code === '4000')!;
        const cogsAccount = accounts.find(a => a.code === '5000')!;
        const salariesAccount = accounts.find(a => a.code === '6000')!;
        const rentAccount = accounts.find(a => a.code === '6100')!;
        const utilitiesAccount = accounts.find(a => a.code === '6200')!;
        const marketingAccount = accounts.find(a => a.code === '6300')!;

        // Monthly revenue: 50M - 100M per brand
        const monthlyRevenue = 75_000_000 * multiplier;
        const monthlyCOGS = monthlyRevenue * 0.4; // 40% COGS
        const monthlySalaries = 15_000_000 * multiplier;
        const monthlyRent = 5_000_000;
        const monthlyUtilities = 2_000_000;
        const monthlyMarketing = 3_000_000 * multiplier;

        // Create entries for each month
        for (let month = 0; month < 12; month++) {
            const date = new Date(year, month, 15); // Mid-month

            // Revenue transaction
            const revenueTx = await prisma.journalTransaction.create({
                data: {
                    brandId: brand.id,
                    date,
                    description: `Monthly Revenue - ${brand.name}`,
                    status: 'POSTED',
                    entries: {
                        create: [
                            {
                                accountId: cashAccount.id,
                                type: 'DEBIT',
                                amount: monthlyRevenue
                            },
                            {
                                accountId: revenueAccount.id,
                                type: 'CREDIT',
                                amount: monthlyRevenue
                            }
                        ]
                    }
                }
            });

            // COGS transaction
            await prisma.journalTransaction.create({
                data: {
                    brandId: brand.id,
                    date,
                    description: `Monthly COGS - ${brand.name}`,
                    status: 'POSTED',
                    entries: {
                        create: [
                            {
                                accountId: cogsAccount.id,
                                type: 'DEBIT',
                                amount: monthlyCOGS
                            },
                            {
                                accountId: cashAccount.id,
                                type: 'CREDIT',
                                amount: monthlyCOGS
                            }
                        ]
                    }
                }
            });

            // Expense transactions
            await prisma.journalTransaction.create({
                data: {
                    brandId: brand.id,
                    date,
                    description: `Monthly Expenses - ${brand.name}`,
                    status: 'POSTED',
                    entries: {
                        create: [
                            { accountId: salariesAccount.id, type: 'DEBIT', amount: monthlySalaries },
                            { accountId: rentAccount.id, type: 'DEBIT', amount: monthlyRent },
                            { accountId: utilitiesAccount.id, type: 'DEBIT', amount: monthlyUtilities },
                            { accountId: marketingAccount.id, type: 'DEBIT', amount: monthlyMarketing },
                            {
                                accountId: cashAccount.id,
                                type: 'CREDIT',
                                amount: monthlySalaries + monthlyRent + monthlyUtilities + monthlyMarketing
                            }
                        ]
                    }
                }
            });
        }

        const annualRevenue = monthlyRevenue * 12;
        const annualCOGS = monthlyCOGS * 12;
        const annualExpenses = (monthlySalaries + monthlyRent + monthlyUtilities + monthlyMarketing) * 12;
        const annualProfit = annualRevenue - annualCOGS - annualExpenses;

        console.log(`  ✓ ${brand.name}:`);
        console.log(`    Revenue: Rp ${(annualRevenue / 1_000_000).toFixed(0)}M`);
        console.log(`    COGS: Rp ${(annualCOGS / 1_000_000).toFixed(0)}M`);
        console.log(`    Expenses: Rp ${(annualExpenses / 1_000_000).toFixed(0)}M`);
        console.log(`    Net Profit: Rp ${(annualProfit / 1_000_000).toFixed(0)}M`);
    }

    // Create IC transactions
    console.log('\n🔄 Creating inter-company transactions...\n');

    if (brands.length >= 2) {
        // Create 5 IC transactions between brands
        const icTransactions = [
            {
                fromBrandId: brands[0].id,
                toBrandId: brands[1].id,
                type: 'LOAN' as const,
                amount: 50_000_000,
                description: 'Inter-company loan for expansion'
            },
            {
                fromBrandId: brands[1].id,
                toBrandId: brands[0].id,
                type: 'SERVICE_FEE' as const,
                amount: 10_000_000,
                description: 'Management services fee'
            },
            {
                fromBrandId: brands[0].id,
                toBrandId: brands[2] ? brands[2].id : brands[1].id,
                type: 'MATERIAL_TRANSFER' as const,
                amount: 25_000_000,
                description: 'Raw material transfer'
            },
            {
                fromBrandId: brands[1].id,
                toBrandId: brands[2] ? brands[2].id : brands[0].id,
                type: 'SHARED_EXPENSE' as const,
                amount: 15_000_000,
                description: 'Shared marketing campaign'
            },
            {
                fromBrandId: brands[2] ? brands[2].id : brands[0].id,
                toBrandId: brands[0].id,
                type: 'SERVICE_FEE' as const,
                amount: 8_000_000,
                description: 'IT support services'
            }
        ];

        for (const icTx of icTransactions) {
            await prisma.interCompanyTransaction.create({
                data: {
                    ...icTx,
                    status: 'APPROVED',
                    createdAt: new Date(2024, 5, 15) // Mid-year
                }
            });
        }

        console.log(`  ✓ Created ${icTransactions.length} IC transactions`);
        console.log(`  Total IC Amount: Rp ${(icTransactions.reduce((sum, tx) => sum + tx.amount, 0) / 1_000_000).toFixed(0)}M`);
    }

    // Summary
    const totalJournals = await prisma.journalTransaction.count({
        where: {
            date: {
                gte: new Date(2024, 0, 1),
                lte: new Date(2024, 11, 31)
            }
        }
    });

    console.log('\n✨ Seeding Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`  - Brands: ${brands.length}`);
    console.log(`  - Ledger Accounts: ${brands.length * 18}`);
    console.log(`  - Journal Transactions: ${totalJournals}`);
    console.log(`  - IC Transactions: ${icTransactions.length || 0}`);
    console.log('\n🎯 Ready to test Consolidated Financial Statements!');
    console.log('   Navigate to: http://localhost:3000/dashboard/owner');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
