
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking Marketplace Sales Records...');

    const sales = await prisma.marketplaceDailySales.findMany({
        orderBy: { reportDate: 'desc' },
        take: 5
    });

    if (sales.length === 0) {
        console.log('❓ No sales records found.');
    } else {
        sales.forEach(s => {
            console.log(`- [${s.platform}] Date: ${s.reportDate.toISOString().split('T')[0]}, Revenue: ${s.totalRevenue}, Orders: ${s.totalOrders}`);
        });
    }

    const integrations = await prisma.emailIntegration.findMany();
    console.log('\n📡 Last Sync Status:');
    integrations.forEach(i => {
        console.log(`- ${i.platform}: ${i.lastSyncAt ? i.lastSyncAt.toISOString() : 'Never'}`);
    });

    await prisma.$disconnect();
}

main();
