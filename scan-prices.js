const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const suspicious = await prisma.frozenVariant.findMany({
        where: {
            OR: [
                {
                    unit: { in: ['gram', 'ml', 'g', 'l'] },
                    costPrice: { gt: 500 } // > 500 per gram/ml is likely a pack price
                },
                // Check for general high prices just in case
                { costPrice: { gt: 100000 } }
            ]
        },
        include: {
            product: true
        }
    });

    let report = '--- SUSPICIOUS ITEMS REPORT ---\n';
    report += `Found ${suspicious.length} items that might have incorrect Pack Price as Unit Price.\n\n`;

    suspicious.forEach(item => {
        report += `[${item.product.name} - ${item.name}] Price: Rp ${Number(item.costPrice).toLocaleString()} / ${item.unit}\n`;
    });

    fs.writeFileSync('scan_report.txt', report);
    console.log('Report written to scan_report.txt');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
