// Check Email Integrations Script
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkIntegrations() {
    console.log('📧 Checking Email Integrations...\n');

    try {
        const integrations = await prisma.emailIntegration.findMany({
            include: {
                brand: {
                    select: { name: true, slug: true }
                }
            }
        });

        if (integrations.length === 0) {
            console.log('❌ No email integrations found in database.');
        } else {
            integrations.forEach(integration => {
                console.log(`✅ Integration Found:`);
                console.log(`   - Email: ${integration.emailAddress}`);
                console.log(`   - Brand: ${integration.brand.name} (${integration.brand.slug})`);
                console.log(`   - Active: ${integration.isActive}`);
                console.log(`   - Last Sync: ${integration.lastSyncAt || 'Never'}`);
                console.log(`   - Total Synced: ${integration.totalSynced}`);
                console.log('---');
            });
        }

    } catch (error) {
        console.error('❌ Error checking integrations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkIntegrations();
