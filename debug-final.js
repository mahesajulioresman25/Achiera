
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFinal() {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
        });

        if (!brand) return console.log("Brand not found");
        console.log("Brand Info:", { id: brand.id, slug: brand.slug, name: brand.name });

        const config = await prisma.flashSaleConfig.findFirst({
            where: {
                brandId: brand.id,
                isActive: true
            }
        });

        if (!config) return console.log("No active config in DB for brandId:", brand.id);
        console.log("Config Details:", { id: config.id, name: config.name, brandId: config.brandId });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log("Now:", now.toLocaleString());
        console.log("Today (Midnight):", today.toLocaleString());

        // Exact logic from FlashSaleService
        console.log("Checking Date Range...");
        if (config.startDate && today < new Date(config.startDate)) {
            console.log("FAILED: today < startDate", today.toISOString(), config.startDate.toISOString());
        }
        if (config.endDate && today > new Date(config.endDate)) {
            console.log("FAILED: today > endDate", today.toISOString(), config.endDate.toISOString());
        }

        console.log("Checking Time Range...");
        const [startHour, startMin] = config.startTime.split(':').map(Number);
        const [endHour, endMin] = config.endTime.split(':').map(Number);

        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        const currentMinutes = currentHour * 60 + currentMin;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        console.log(`Current Minutes: ${currentMinutes}`);
        console.log(`Start Minutes: ${startMinutes} (${config.startTime})`);
        console.log(`End Minutes: ${endMinutes} (${config.endTime})`);

        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            console.log("SUCCESS: Flash Sale is ACTIVE");
        } else {
            console.log("FAILED: Outside time range");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugFinal();
