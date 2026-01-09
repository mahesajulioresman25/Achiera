
import { PrismaClient } from '@prisma/client';
import { upsertCampaignAction } from '../src/lib/actions/commerce/campaigns';
import { upsertFlashSaleConfig } from '../src/lib/actions/commerce/flashSale';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Serialization of Actions...');

    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (!brand) return;

    try {
        const campaign = await prisma.campaign.findFirst({ where: { brandId: brand.id } });
        if (campaign) {
            console.log('Campaign serialization test:');
            console.log(JSON.stringify(campaign));
            console.log('✅ Campaign serialized successfully');
        }
    } catch (e: any) {
        console.error('❌ Campaign serialization failed:', e.message);
    }

    try {
        const flashSale = await prisma.flashSaleConfig.findFirst({ where: { brandId: brand.id } });
        if (flashSale) {
            console.log('Flash Sale serialization test:');
            console.log(JSON.stringify(flashSale));
            console.log('✅ Flash Sale serialized successfully');
        }
    } catch (e: any) {
        console.error('❌ Flash Sale serialization failed:', e.message);
    }

    await prisma.$disconnect();
}

main();
