
import { PrismaClient } from '@prisma/client';

async function diag() {
    const prisma = new PrismaClient();
    try {
        console.log("Checking connection pool status...");
        // @ts-ignore - checking internal config
        const config = prisma._engineConfig;
        console.log("Prisma Engine Config:", JSON.stringify({
            activeProvider: config?.activeProvider,
            datasourceNames: config?.datasourceNames,
            // Don't log full connection string
            limit: config?.connectionLimit,
        }, null, 2));

        // Get brand config for Rasa Ibu to see what the navbar should look like
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: { brandConfig: true }
        });

        console.log("Rasa Ibu Brand Config:", JSON.stringify(brand?.brandConfig, null, 2));

    } catch (e) {
        console.error("Diagnosis failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

diag();
