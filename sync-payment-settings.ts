// Sync Brand Payment Settings with Bank Accounts Table
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPaymentSettings() {
    console.log('🔄 Synchronizing Brand Payment Settings with Bank Accounts...\n');

    try {
        // 1. Get all brands
        const brands = await prisma.brand.findMany({
            include: {
                bankAccounts: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        for (const brand of brands) {
            console.log(`👤 Processing Brand: ${brand.name} (${brand.slug})...`);

            const primaryBank = brand.bankAccounts[0];

            if (primaryBank) {
                console.log(`   ✅ Found active bank: ${primaryBank.bankName} - ${primaryBank.accountNumber}`);

                const currentSettings = (brand.paymentSettings as any) || {};
                const newSettings = {
                    ...currentSettings,
                    bankName: primaryBank.bankName,
                    accountNumber: primaryBank.accountNumber,
                    accountHolder: primaryBank.accountHolder,
                    // Ensure other defaults if they don't exist
                    qrisEnabled: currentSettings.qrisEnabled ?? false,
                    downPaymentPercentage: currentSettings.downPaymentPercentage ?? 50
                };

                await prisma.brand.update({
                    where: { id: brand.id },
                    data: { paymentSettings: newSettings }
                });

                console.log('   ✨ Updated paymentSettings JSON successfully.');
            } else {
                console.log('   ⚠️ No active bank accounts found for this brand.');
            }
            console.log('---');
        }

        console.log('\n✅ Synchronization complete!');

    } catch (error) {
        console.error('❌ Error during synchronization:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncPaymentSettings();
