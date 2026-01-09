import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupBankAccounts() {
    console.log('🏦 Setting up Brand-Specific Bank Accounts (RAW SQL)...');

    try {
        // Find brands by name to be more robust
        const rasaIbu = await prisma.brand.findFirst({ where: { name: { contains: 'Rasa Ibu' } } });
        const merch = await prisma.brand.findFirst({ where: { name: { contains: 'Merch' } } });

        console.log(`✅ Brands Check:\n- Rasa Ibu: ${rasaIbu?.name || 'NOT FOUND'} (${rasaIbu?.id || 'N/A'})\n- Merch: ${merch?.name || 'NOT FOUND'} (${merch?.id || 'N/A'})`);

        // 1. Setup Rasa Ibu Bank Account
        if (rasaIbu) {
            await prisma.$executeRaw`
                INSERT INTO bank_accounts (id, brandId, bankName, accountNumber, accountHolder, isActive, createdAt, updatedAt)
                VALUES ('rasa-ibu-bca-main', ${rasaIbu.id}, 'BCA', '8000818181', 'RASA IBU - ACHIERA', 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                brandId = ${rasaIbu.id},
                bankName = 'BCA',
                accountNumber = '8000818181',
                accountHolder = 'RASA IBU - ACHIERA',
                isActive = 1,
                updatedAt = NOW();
            `;
            console.log('✅ Rasa Ibu Bank Account configured (BCA)');
        } else {
            console.log('⚠️ Skipping Rasa Ibu account setup (Brand not found)');
        }

        // 2. Setup ACHIERA Merch Bank Account
        if (merch) {
            await prisma.$executeRaw`
                INSERT INTO bank_accounts (id, brandId, bankName, accountNumber, accountHolder, isActive, createdAt, updatedAt)
                VALUES ('achiera-merch-bca-main', ${merch.id}, 'BCA', '1234567890', 'ACHIERA MERCHANDISE', 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                brandId = ${merch.id},
                bankName = 'BCA',
                accountNumber = '1234567890',
                accountHolder = 'ACHIERA MERCHANDISE',
                isActive = 1,
                updatedAt = NOW();
            `;
            console.log('✅ ACHIERA Merch Bank Account configured (BCA)');
        } else {
            console.log('⚠️ Skipping Merch account setup (Brand not found)');
        }

        // 3. Setup Global Bank Account (nullable brandId)
        await prisma.$executeRaw`
            INSERT INTO bank_accounts (id, brandId, bankName, accountNumber, accountHolder, isActive, createdAt, updatedAt)
            VALUES ('global-mandiri-main', NULL, 'Mandiri', '9876543210', 'ACHIERA GROUP', 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            brandId = NULL,
            bankName = 'Mandiri',
            accountNumber = '9876543210',
            accountHolder = 'ACHIERA GROUP',
            isActive = 1,
            updatedAt = NOW();
        `;
        console.log('✅ Global Bank Account configured (Mandiri)');

        console.log('\n🎉 Bank account configuration completed!');

    } catch (error) {
        console.error('❌ Error setting up bank accounts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupBankAccounts();
