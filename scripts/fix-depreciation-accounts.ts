
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Depreciation Account Fix...');

    const brandSlug = 'rasa-ibu'; // Focusing on Rasa Ibu
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
    });

    if (!brand) throw new Error('Brand not found');

    // 1. Identify the WRONG account (5-1100)
    const wrongAccount = await prisma.ledgerAccount.findFirst({
        where: {
            brandId: brand.id,
            code: '5-1100', // Biaya Kemasan
        },
    });

    // 2. Identify/Create the CORRECT account (5-7000)
    let correctAccount = await prisma.ledgerAccount.findFirst({
        where: {
            brandId: brand.id,
            code: '5-7000', // Biaya Penyusutan
        },
    });

    if (!correctAccount) {
        console.log('Creating correct account 5-7000...');
        correctAccount = await prisma.ledgerAccount.create({
            data: {
                brandId: brand.id,
                code: '5-7000',
                name: 'Beban Penyusutan Aset',
                type: 'EXPENSE',
                balance: 0,
            },
        });
    }

    if (!wrongAccount) {
        console.log('Wrong account (5-1100) not found, nothing to fix? checking logs...');
    } else {
        // 3. Find entries that are DEPRECIATION but linked to 5-1100
        // We check JournalEntry where accountId = wrongAccount.id
        // And the parent transaction has referenceType = 'DEPRECIATION'

        const entriesToFix = await prisma.journalEntry.findMany({
            where: {
                accountId: wrongAccount.id,
                transaction: {
                    referenceType: 'DEPRECIATION'
                }
            },
            include: {
                transaction: true
            }
        });

        console.log(`Found ${entriesToFix.length} misclassified entries.`);

        for (const entry of entriesToFix) {
            console.log(`Fixing entry ${entry.id} (${entry.transaction.description})...`);

            await prisma.journalEntry.update({
                where: { id: entry.id },
                data: {
                    accountId: correctAccount.id
                }
            });
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
