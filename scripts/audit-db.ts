
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Audit ---');
    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (!brand) {
        console.log('Brand rasa-ibu not found');
        return;
    }

    const configs = await prisma.flashSaleConfig.findMany({
        where: { brandId: brand.id },
        select: { id: true, name: true, isActive: true }
    });
    console.log('Flash Sale Configs:', configs);

    const campaigns = await prisma.campaign.findMany({
        where: { brandId: brand.id },
        select: { id: true, title: true, slug: true, isActive: true }
    });
    console.log('Campaigns:', campaigns);

    await prisma.$disconnect();
}
main();
