
import { EmailParserService } from './src/lib/services/EmailParserService';
import { prisma } from './src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function runsync() {
    console.log("Starting manual Email Sync...");
    const brands = await prisma.brand.findMany({ where: { isActive: true } });
    const brandId = brands[0]?.id; // Use first active brand

    if (!brandId) {
        console.error("No active brand found");
        return;
    }

    const email = process.env.EMAIL_ADDRESS;
    const password = process.env.EMAIL_APP_PASSWORD;

    if (!email || !password) {
        console.error("Missing email credentials in .env");
        return;
    }

    const parser = new EmailParserService();
    try {
        await parser.connect(email, password);
        console.log("Connected to IMAP. Listening for orders...");
        await parser.listenForOrders(brandId);
        console.log("Sync complete.");
    } catch (e) {
        console.error("Sync failed:", e);
    } finally {
        await parser.disconnect();
        await prisma.$disconnect();
    }
}

runsync();
