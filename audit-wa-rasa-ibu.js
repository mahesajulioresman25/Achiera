const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWhatsApp() {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: {
                whatsappCampaigns: true,
                whatsappQueue: {
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!brand) {
            console.log('Brand "rasa-ibu" not found.');
            return;
        }

        console.log(`Brand: ${brand.name}`);
        console.log(`WhatsApp Campaigns: ${brand.whatsappCampaigns.length}`);
        brand.whatsappCampaigns.forEach(c => {
            console.log(`- ${c.name} (Status: ${c.status})`);
        });

        console.log(`\nWhatsApp Queue (Latest 10):`);
        if (brand.whatsappQueue.length === 0) console.log('Queue is empty.');
        brand.whatsappQueue.forEach(q => {
            console.log(`- [${q.createdAt.toISOString()}] To: ${q.phone} | Status: ${q.status}`);
        });

    } catch (e) {
        console.error('WA Audit Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkWhatsApp();
