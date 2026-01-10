
import { PrismaClient } from '@prisma/client';
import { FinancialReports } from '../src/lib/intelligence/financialReports';

const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.log('Brand Rasa Ibu not found');
        return;
    }

    console.log(`Checking ${brand.name} (ID: ${brand.id} )`);
    const accountsCount = await prisma.ledgerAccount.count({ where: { brandId: brand.id } });
    const journalEntriesCount = await prisma.journalEntry.count({ where: { account: { brandId: brand.id } } });
    const ordersCount = await prisma.order.count({ where: { brandId: brand.id } });
    const marketplaceSalesCount = await prisma.marketplaceDailySales.count({ where: { brandId: brand.id } });
    const campaignReportsCount = await prisma.marketplaceCampaignReport.count({ where: { brandId: brand.id } });

    console.log('Total Ledger Accounts:', accountsCount);
    console.log('Total Journal Entries:', journalEntriesCount);
    console.log('Total Orders:', ordersCount);
    console.log('Total Marketplace Sales:', marketplaceSalesCount);
    console.log('Total Campaign Reports:', campaignReportsCount);

    const emailIntegrations = await prisma.emailIntegration.findMany({ where: { brandId: brand.id, isActive: true } });
    console.log('Active Email Integrations:', emailIntegrations.length);
    for (const integration of emailIntegrations) {
        console.log(` - Email: ${integration.emailAddress}, Last Sync: ${integration.lastSyncAt}`);
    }

    if (journalEntriesCount > 0) {
        const latestEntries = await prisma.journalEntry.findMany({
            where: { account: { brandId: brand.id } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { account: true }
        });
        console.log('Latest Entries:');
        latestEntries.forEach(e => {
            console.log(`- [${e.createdAt.toISOString()}] ${e.account.name}: Dr ${e.debit} Cr ${e.credit}`);
        });
    }

    const range = {
        start: new Date('2024-01-01'),
        end: new Date()
    };

    console.log('\n--- Financial Report Test ---');
    const pl = await FinancialReports.getProfitLoss(brand.id, range) as any;
    console.log('P&L items count:', pl.revenue.items.length + pl.expenses.items.length);
    console.log('P&L Net Profit:', pl.netProfit);

    const bs = await FinancialReports.getBalanceSheet(brand.id, range.end) as any;
    console.log('BS Assets:', bs.assets.items.length);
    console.log('BS Liabilities:', bs.liabilities.items.length);
    console.log('BS Equity:', bs.equity.items.length);
    console.log('BS Total Assets:', bs.assets.total);
    console.log('BS Total Liab + Eq:', bs.liabilities.total + bs.equity.total);
}

main()
    .catch(e => {
        console.error('--- CRITICAL ERROR ---');
        console.error(e);
        if (e.stack) console.error(e.stack);
    })
    .finally(() => prisma.$disconnect());
