
import { PrismaClient } from '@prisma/client';
import { EmailParserService } from '../src/lib/services/EmailParserService';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Manual Email Sync Test...');

    const email = process.env.EMAIL_ADDRESS;
    const password = process.env.EMAIL_APP_PASSWORD;

    if (!email || !password) {
        console.error('❌ EMAIL_ADDRESS or EMAIL_APP_PASSWORD not found in environment');
        process.exit(1);
    }

    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.error('❌ Brand Rasa Ibu not found');
        process.exit(1);
    }

    const parser = new EmailParserService();

    try {
        console.log(`📡 Connecting to ${email}...`);
        await parser.connect(email, password);
        console.log('✅ Connected to IMAP');

        console.log(`🔍 Searching for new emails for brand: ${brand.name}...`);
        await parser.listenForOrders(brand.id);

        console.log('✅ Sync Completed Successfully');
    } catch (error) {
        console.error('❌ Sync Failed:', error);
    } finally {
        await parser.disconnect();
        await prisma.$disconnect();
    }
}

main();
