import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullPaymentFix() {
    console.log('Restoring Payment Configuration...');

    // 1. Update Brand QRIS (using the verified valid image)
    const validQrisPath = "/uploads/qris/cmjp1yznb0000lhwqnivhwhvt-1767370195914.jpg";

    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (brand) {
        const currentSettings = (brand.paymentSettings as any) || {};
        const newSettings = {
            ...currentSettings,
            qrisEnabled: true,
            qrisImageUrl: validQrisPath,
            whatsappOrderAdmin: currentSettings.whatsappOrderAdmin || "6285157134313",
            whatsappCrm: currentSettings.whatsappCrm || "6285157134313"
        };

        await prisma.brand.update({
            where: { id: brand.id },
            data: { paymentSettings: newSettings }
        });
        console.log('✅ Brand QRIS updated to:', validQrisPath);
    }

    // 2. Ensure at least one active bank account exists
    const bankCount = await prisma.bankAccount.count({ where: { isActive: true } });
    if (bankCount === 0) {
        await prisma.bankAccount.create({
            data: {
                bankName: "BCA",
                accountNumber: "8000818181",
                accountHolder: "RASA IBU - ACHIERA",
                isActive: true
            }
        });
        console.log('✅ Created placeholder BCA account for Rasa Ibu');
    } else {
        console.log(`ℹ️ Already have ${bankCount} active bank(s)`);
    }

    // 3. Verify
    const finalBanks = await prisma.bankAccount.findMany({ where: { isActive: true } });
    console.log('Final Active Banks:', JSON.stringify(finalBanks, null, 2));

    await prisma.$disconnect();
}

fullPaymentFix().catch(console.error);
