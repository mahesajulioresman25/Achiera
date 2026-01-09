// Register Email Integration Script (Fixed)
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function registerEmail() {
    const brandSlug = 'rasa-ibu';
    const emailAddress = 'achiera25.id@gmail.com';
    const platform = 'MARKETPLACE'; // Required field in schema

    console.log(`📧 Registering email integration for brand: ${brandSlug}...`);

    try {
        // 1. Find the brand
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug }
        });

        if (!brand) {
            console.error(`❌ Brand with slug "${brandSlug}" not found!`);
            return;
        }

        // 2. Check if integration already exists
        const existing = await prisma.emailIntegration.findFirst({
            where: {
                brandId: brand.id,
                emailAddress: emailAddress
            }
        });

        let integration;
        if (existing) {
            console.log('   ℹ️ Integration already exists, updating status...');
            integration = await prisma.emailIntegration.update({
                where: { id: existing.id },
                data: { isActive: true, platform }
            });
        } else {
            console.log('   🆕 Creating new email integration...');
            integration = await prisma.emailIntegration.create({
                data: {
                    brandId: brand.id,
                    emailAddress: emailAddress,
                    platform: platform,
                    isActive: true
                }
            });
        }

        console.log(`✅ Success! Email ${emailAddress} is now registered for brand "${brand.name}".`);
        console.log(`🔗 Integration ID: ${integration.id}`);

    } catch (error: any) {
        console.error('❌ Error registering email:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

registerEmail();
