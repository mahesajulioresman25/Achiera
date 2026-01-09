
import { PrismaClient } from '@prisma/client';
import { upsertCampaignAction } from '../src/lib/actions/commerce/campaigns';
import { upsertFlashSaleConfig } from '../src/lib/actions/commerce/flashSale';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Debugging Upsert Actions...');

    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (!brand) {
        console.error('❌ Brand "rasa-ibu" not found');
        return;
    }

    console.log(`📦 Using Brand ID: ${brand.id}`);

    // Test Campaign Upsert
    console.log('\n--- Testing Campaign Upsert ---');
    try {
        const campaignData = {
            title: 'Test Campaign',
            slug: 'test-' + Date.now(),
            description: 'Test description',
            startDate: '2026-01-05',
            endDate: '2026-01-06',
            isActive: true
        };
        const result = await upsertCampaignAction(campaignData, brand.id);
        console.log('✅ Campaign Upsert Success:', result.id);
    } catch (error: any) {
        console.error('❌ Campaign Upsert Failed:', error.message);
    }

    // Test existing slug for Campaign
    console.log('\n--- Testing Campaign Duplicate Slug ---');
    try {
        // Find an existing campaign slug if any
        const existing = await prisma.campaign.findFirst({ where: { brandId: brand.id } });
        if (existing) {
            const campaignData = {
                title: 'Duplicate Campaign',
                slug: existing.slug,
                startDate: '2026-01-05',
                endDate: '2026-01-06',
                isActive: true
            };
            await upsertCampaignAction(campaignData, brand.id);
            console.log('✅ Campaign Upsert Success (Unexpected if duplicate):');
        } else {
            console.log('ℹ️ No existing campaigns to test duplicates');
        }
    } catch (error: any) {
        console.error('❌ Campaign Duplicate Slug Failed (Expected):', error.message);
    }

    // Test Flash Sale Upsert
    console.log('\n--- Testing Flash Sale Upsert ---');
    try {
        const flashSaleData = {
            name: 'Flash Sale Test',
            startTime: '11:00',
            endTime: '13:00',
            discountPercentage: 20,
            activeDays: ["SENIN"],
            isActive: true
        };
        const result = await upsertFlashSaleConfig(flashSaleData, brand.id);
        console.log('✅ Flash Sale Upsert Success:', result.id);
    } catch (error: any) {
        console.error('❌ Flash Sale Upsert Failed:', error.message);
    }

    await prisma.$disconnect();
}

main();
