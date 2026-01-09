// Check Marketplace Data Script with Dotenv
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env manually
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function checkMarketplaceData() {
    console.log('📊 Checking Marketplace Data in Database...\n');
    console.log('   Connection URL present:', !!process.env.DATABASE_URL);

    try {
        const dailyCount = await prisma.marketplaceDailySales.count();
        const campaignCount = await prisma.marketplaceCampaignReport.count();
        const reviewCount = await prisma.customerReview.count();
        const insightCount = await prisma.marketplaceInsight.count();

        console.log(`📈 Summary:`);
        console.log(`   - MarketplaceDailySales: ${dailyCount}`);
        console.log(`   - MarketplaceCampaignReport: ${campaignCount}`);
        console.log(`   - CustomerReview: ${reviewCount}`);
        console.log(`   - MarketplaceInsight: ${insightCount}`);

        if (dailyCount > 0) {
            console.log('\n📅 Recent Daily Sales (latest 3):');
            const recentSales = await prisma.marketplaceDailySales.findMany({
                take: 3,
                orderBy: { reportDate: 'desc' }
            });
            console.log(JSON.stringify(recentSales, null, 2));
        }

    } catch (error: any) {
        console.error('❌ Error checking marketplace data:', error.message || error);
        if (error.code) console.error('   Prisma Error Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

checkMarketplaceData();
