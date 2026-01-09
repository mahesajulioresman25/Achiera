
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
        if (!brand) {
            console.log('Brand rasa-ibu not found');
            return;
        }
        console.log('Brand ID:', brand.id);

        const campaigns = await prisma.campaign.findMany({
            where: { brandId: brand.id }
        });
        console.log('Total Campaigns:', campaigns.length);

        const now = new Date();
        console.log('Current Time:', now.toISOString());

        campaigns.forEach(c => {
            console.log('--------------------------------');
            console.log(`Campaign: ${c.title} (ID: ${c.id})`);
            console.log(`Is Active: ${c.isActive}`);
            console.log(`Start: ${c.startDate.toISOString()}`);
            console.log(`End:   ${c.endDate.toISOString()}`);
            console.log(`Now >= Start: ${now >= c.startDate}`);
            console.log(`Now <= End:   ${now <= c.endDate}`);
            console.log(`Should Show? ${c.isActive && now >= c.startDate && now <= c.endDate}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
