
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
        if (!brand) return console.log('Brand not found');

        const configs = await prisma.flashSaleConfig.findMany({
            where: { brandId: brand.id }
        });

        console.log(`Found ${configs.length} configs.`);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log('Current Server Time:', now.toString());
        console.log('Today (Midnight):', today.toString());

        for (const c of configs) {
            console.log('--------------------------------');
            console.log(`Name: ${c.name}`);
            console.log(`Active in DB: ${c.isActive}`);
            console.log(`Start Date: ${c.startDate}`);
            console.log(`End Date: ${c.endDate}`);
            console.log(`Start Time: ${c.startTime}`);
            console.log(`End Time: ${c.endTime}`);

            // Logic Simulation from FlashSaleService
            let status = "OK";
            if (c.startDate && today < new Date(c.startDate)) status = "Not Started (Date)";
            if (c.endDate && today > new Date(c.endDate)) status = "Expired (Date)";

            const [sh, sm] = c.startTime.split(':').map(Number);
            const [eh, em] = c.endTime.split(':').map(Number);
            const ch = now.getHours();
            const cm = now.getMinutes();
            const curM = ch * 60 + cm;
            const startM = sh * 60 + sm;
            const endM = eh * 60 + em;

            if (curM < startM) status = "Not Started (Time)";
            if (curM >= endM) status = "Ended (Time)";

            console.log(`Calculated Status: ${status}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
