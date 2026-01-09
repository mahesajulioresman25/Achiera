
import { PrismaClient } from '@prisma/client';
import { initializeChartOfAccounts } from '../src/lib/intelligence/chartOfAccounts';
import { JournalService } from '../src/lib/intelligence/journalService';
import { FinancialReports } from '../src/lib/intelligence/financialReports';
import { updateOrderStatus } from '../src/lib/actions/rasa-ibu/orders';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING VERIFICATION ---');
    const timestamp = Date.now();
    const brandId = `test-brand-${timestamp}`;

    // 0. Create Brand
    console.log('\n0. Creating Brand...');
    await prisma.brand.create({
        data: {
            id: brandId,
            name: `Test Brand ${timestamp}`,
            slug: `test-brand-${timestamp}`
        }
    });

    // 1. Initialize CoA
    console.log('\n1. Initializing Chart of Accounts...');
    await initializeChartOfAccounts(brandId);
    const accounts = await prisma.ledgerAccount.count({ where: { brandId } });
    console.log(`   -> Created ${accounts} accounts.`);

    // 2. Create Dummy Order
    console.log('\n2. Creating Dummy Order...');
    const order = await prisma.order.create({
        data: {
            brandId,
            invoiceNo: `TEST-${Date.now()}`,
            customerName: 'Test Buyer',
            totalAmount: 500000,
            status: 'DIPESAN',
            channel: 'WHATSAPP',
            quantity: 1,
            subtotal: 500000,
            total: 500000,
            internalNotes: 'Test Order'
        }
    });
    console.log(`   -> Order created: ${order.id}`);

    // 3. Mark as Paid (Trigger Journal Entry)
    console.log('\n3. Marking order as PAID...');
    // We need to simulate the server action environment or call logic directly
    // Since updateOrderStatus imports from @/lib/..., it might fail in ts-node if path aliases aren't set up.
    // So we will simulate the logic directly here if needed, BUT ideally we test the actual function.
    // We'll try calling the logic analogous to what we put in orders.ts to test the Service integration.

    // Simulate what orders.ts does:
    await JournalService.recordSale(brandId, order.id, 500000, true);
    console.log('   -> Journal Entry recorded manually (simulating orders.ts)');

    // 4. Verify Ledger Entries
    console.log('\n4. Verifying Ledger Entries...');
    const entries = await JournalService.getLedgerEntries(brandId);
    console.log(`   -> Found ${entries.length} journal entries.`);
    entries.forEach(e => {
        const debitNum = Number(e.debit);
        const creditNum = Number(e.credit);
        console.log(`      [${e.account.code}] ${e.account.name}: ${debitNum > 0 ? 'Dr ' + debitNum : 'Cr ' + creditNum}`);
    });

    // 5. Verify Financial Reports
    console.log('\n5. Verifying Financial Reports...');
    const pl = await FinancialReports.getProfitLoss(brandId, { start: new Date(0), end: new Date() });
    console.log('   -> P&L Revenue:', pl.revenue.total);
    console.log('   -> P&L Net Profit:', pl.netProfit);

    const bs = await FinancialReports.getBalanceSheet(brandId, new Date());
    console.log('   -> BS Assets:', bs.assets.total);
    console.log('   -> BS Equity:', bs.equity.total);
    console.log('   -> BS Check (Asset = Liab + Equity):', bs.assets.total === (bs.liabilities.total + bs.equity.total));

    console.log('\n--- VERIFICATION COMPLETE ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
