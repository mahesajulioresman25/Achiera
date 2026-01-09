const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const accounts = [
    // ASSETS (1-xxxx)
    { code: '1-1000', name: 'Kas Utama (Ops)', type: 'ASSET' },
    { code: '1-1001', name: 'Kas Kecil (Petty Cash)', type: 'ASSET' },
    { code: '1-1100', name: 'Bank BCA', type: 'ASSET' },
    { code: '1-1101', name: 'Bank Mandiri', type: 'ASSET' },
    { code: '1-1200', name: 'Piutang Usaha', type: 'ASSET' },
    { code: '1-1300', name: 'Persediaan Barang', type: 'ASSET' },
    { code: '1-1400', name: 'Perlengkapan', type: 'ASSET' },
    { code: '1-1500', name: 'Aset Tetap - Peralatan', type: 'ASSET' },

    // LIABILITIES (2-xxxx)
    { code: '2-1000', name: 'Hutang Usaha', type: 'LIABILITY' },
    { code: '2-1100', name: 'Hutang Gaji', type: 'LIABILITY' },

    // EQUITY (3-xxxx)
    { code: '3-1000', name: 'Modal Disetor', type: 'EQUITY' },
    { code: '3-2000', name: 'Laba Ditahan', type: 'EQUITY' },

    // REVENUE (4-xxxx)
    { code: '4-1000', name: 'Penjualan Makanan', type: 'REVENUE' },
    { code: '4-1001', name: 'Penjualan Minuman', type: 'REVENUE' },
    { code: '4-2000', name: 'Pendapatan Lain-lain', type: 'REVENUE' },

    // EXPENSES (5-xxxx)
    { code: '5-1000', name: 'HPP Makanan', type: 'EXPENSE' },
    { code: '5-1001', name: 'HPP Minuman', type: 'EXPENSE' },
    { code: '5-PANTRY', name: 'Bahan Baku & Dapur', type: 'EXPENSE' }, // System-driven
    { code: '5-WASTE', name: 'Kerusakan & Kedaluwarsa Dapur', type: 'EXPENSE' }, // System-driven
    { code: '5-2000', name: 'Biaya Gaji', type: 'EXPENSE' },
    { code: '5-2001', name: 'Biaya Listrik & Air', type: 'EXPENSE' },
    { code: '5-2002', name: 'Biaya Sewa', type: 'EXPENSE' },
    { code: '5-2003', name: 'Biaya Marketing', type: 'EXPENSE' },
    { code: '5-2004', name: 'Biaya Operasional Lainnya', type: 'EXPENSE' },
    { code: '5-2005', name: 'Biaya Gas', type: 'EXPENSE' }
];

async function main() {
    console.log('Starting seed COA...');

    // Get ALL brands
    const brands = await prisma.brand.findMany();
    if (brands.length === 0) {
        console.error('No brands found!');
        return;
    }

    for (const brand of brands) {
        console.log(`Seeding COA for brand: ${brand.name} (${brand.id})`);

        for (const acc of accounts) {
            await prisma.ledgerAccount.upsert({
                where: {
                    brandId_code: {
                        brandId: brand.id,
                        code: acc.code
                    }
                },
                update: {
                    name: acc.name,
                    type: acc.type
                },
                create: {
                    brandId: brand.id,
                    code: acc.code,
                    name: acc.name,
                    type: acc.type
                }
            });
            console.log(`Upserted [${brand.name}]: ${acc.code} - ${acc.name}`);
        }
    }
    console.log('Seeding completed successfully for all brands.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
