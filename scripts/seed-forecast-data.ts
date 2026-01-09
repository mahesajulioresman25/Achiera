import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding historical data for Cash Flow Forecasting...');

    const brands = await prisma.brand.findMany({
        where: { isActive: true }
    });

    if (brands.length === 0) {
        console.log('❌ No brands found. Please seed brands first.');
        return;
    }

    const today = new Date();

    for (const brand of brands) {
        console.log(`Processing brand: ${brand.name}`);

        // Ensure cash account exists
        let cashAccount = await prisma.ledgerAccount.findFirst({
            where: { brandId: brand.id, code: '1000' }
        });

        if (!cashAccount) {
            cashAccount = await prisma.ledgerAccount.create({
                data: {
                    brandId: brand.id,
                    name: 'Cash',
                    code: '1000',
                    type: 'ASSET',
                    balance: 500000000,
                    isActive: true
                }
            });
        }

        // Ensure a revenue account exists
        let revenueAccount = await prisma.ledgerAccount.findFirst({
            where: { brandId: brand.id, type: 'REVENUE' }
        });

        if (!revenueAccount) {
            revenueAccount = await prisma.ledgerAccount.create({
                data: {
                    brandId: brand.id,
                    name: 'Sales Revenue',
                    code: '4000',
                    type: 'REVENUE',
                    balance: 0,
                    isActive: true
                }
            });
        }

        // Ensure an expense account exists
        let expenseAccount = await prisma.ledgerAccount.findFirst({
            where: { brandId: brand.id, type: 'EXPENSE' }
        });

        if (!expenseAccount) {
            expenseAccount = await prisma.ledgerAccount.create({
                data: {
                    brandId: brand.id,
                    name: 'Operating Expense',
                    code: '5000',
                    type: 'EXPENSE',
                    balance: 0,
                    isActive: true
                }
            });
        }

        for (let i = 12; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 15);

            const baseInflow = 100000000;
            const growthFactor = 1 + (12 - i) * 0.05;
            const seasonalFactor = (date.getMonth() === 11 || date.getMonth() === 5) ? 1.4 : 1.0;

            const inflow = baseInflow * growthFactor * seasonalFactor * (0.9 + Math.random() * 0.2);
            const outflow = inflow * 0.7 * (0.9 + Math.random() * 0.2);

            await prisma.journalTransaction.create({
                data: {
                    brandId: brand.id,
                    date,
                    description: `Monthly Revenue - ${date.toLocaleString('default', { month: 'long' })}`,
                    createdBy: 'system-seed',
                    entries: {
                        create: [
                            {
                                accountId: cashAccount.id,
                                debit: inflow,
                                credit: 0
                            },
                            {
                                accountId: revenueAccount.id,
                                debit: 0,
                                credit: inflow
                            }
                        ]
                    }
                }
            });

            await prisma.journalTransaction.create({
                data: {
                    brandId: brand.id,
                    date,
                    description: `Monthly Expenses - ${date.toLocaleString('default', { month: 'long' })}`,
                    createdBy: 'system-seed',
                    entries: {
                        create: [
                            {
                                accountId: cashAccount.id,
                                debit: 0,
                                credit: outflow
                            },
                            {
                                accountId: expenseAccount.id,
                                debit: outflow,
                                credit: 0
                            }
                        ]
                    }
                }
            });
        }
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
