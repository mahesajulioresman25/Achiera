
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../src/lib/services/BudgetService';
import { InterCompanyService } from '../src/lib/services/InterCompanyService';

const prisma = new PrismaClient();
const budgetService = new BudgetService();
const icService = new InterCompanyService();

async function main() {
    console.log('🏁 Starting Financial Simulation...');

    // 1. Get Brand IDs
    const brands = await prisma.brand.findMany();
    console.log('📊 Available Brands in DB:', brands.map(b => ({ id: b.id, name: b.name, slug: b.slug })));

    const rasaIbu = brands.find(b => b.slug === 'rasa-ibu');
    const merch = brands.find(b => b.slug === 'merch' || b.slug === 'achiera-merch');
    const it = brands.find(b => b.slug === 'it-solutions' || b.slug === 'achiera-it-solution');

    if (!rasaIbu || !merch || !it) {
        console.error('❌ One or more brands not found. Ensure DB is seeded.');
        process.exit(1);
    }

    console.log(`✅ Brands Found: Rasa Ibu (${rasaIbu.id}), Merch (${merch.id}), IT (${it.id})`);

    // 2. Create Annual Budgets (if not exists)
    const fiscalYear = new Date().getFullYear();
    console.log(`\n📅 Creating Budgets for Fiscal Year ${fiscalYear}...`);

    await createBrandBudget(rasaIbu.id, 500000000, 300000000); // 500M Revenue, 300M Expense
    await createBrandBudget(merch.id, 150000000, 80000000);    // 150M Revenue, 80M Expense
    await createBrandBudget(it.id, 200000000, 50000000);       // 200M Revenue, 50M Expense

    // 3. Create Inter-Company Transactions
    console.log('\n💸 Simulating Inter-Company Transactions...');

    // Rasa Ibu -> Merch (Material Transfer: Uniforms)
    await createICTransaction(rasaIbu.id, merch.id, 'MATERIAL_TRANSFER', 5000000, 'Purchase of uniform batch 1');

    // IT -> Rasa Ibu (Service Fee: POS Maintenance)
    await createICTransaction(it.id, rasaIbu.id, 'SERVICE_FEE', 2500000, 'Monthly POS Maintenance Fee');

    // Rasa Ibu -> IT (Loan)
    await createICTransaction(rasaIbu.id, it.id, 'LOAN', 50000000, 'Seed funding for new server infrastructure');

    console.log('\n🎉 Simulation Complete! Check Dashboards.');
}

async function createBrandBudget(brandId: string, revenue: number, expense: number) {
    const profit = revenue - expense;
    try {
        const result = await budgetService.createBudget({
            brandId,
            fiscalYear: new Date().getFullYear(),
            period: 'ANNUAL',
            revenueTarget: revenue,
            expenseTarget: expense,
            profitTarget: profit
        });

        if (result.success) {
            console.log(`   ✅ Budget Created for Brand ${brandId.substring(0, 8)}...`);
            // Auto approve for demo
            if (result.data) {
                await budgetService.approveBudget(result.data.id, 'SYSTEM_SIMULATION');
                console.log(`      ✅ Budget Auto-Approved`);
            }
        } else {
            console.log(`   ℹ️ Budget creation skipped: ${result.error}`);
        }
    } catch (e) {
        console.error(`   ❌ Failed to create budget: ${e}`);
    }
}

async function createICTransaction(from: string, to: string, type: any, amount: number, desc: string) {
    try {
        const result = await icService.createICTransaction({
            fromBrandId: from,
            toBrandId: to,
            type,
            amount,
            description: desc
        });

        if (result.success) {
            console.log(`   ✅ Transaction Created: ${desc} (${amount})`);
            // Auto approve for demo
            if (result.data) {
                await icService.approveICTransaction(result.data.id, 'SYSTEM_SIMULATION');
                console.log(`      ✅ Transaction Auto-Approved`);
            }
        } else {
            console.error(`   ❌ Failed to create transaction: ${result.error}`);
        }
    } catch (e) {
        console.error(`   ❌ Failed to create transaction: ${e}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
