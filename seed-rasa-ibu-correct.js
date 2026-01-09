const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    console.log('--- STARTING CONSOLIDATED SEEDING FOR RASA IBU (CORRECT ID) ---');

    // 1. CATEGORIES
    console.log('Seeding Categories...');
    const catData = [
        { name: 'Makanan Utama', slug: 'makanan-utama' },
        { name: 'Minuman Segar', slug: 'minuman-segar' },
        { name: 'Camilan Gurih', slug: 'camilan-gurih' }
    ];

    const categories = {};
    for (const cat of catData) {
        const c = await prisma.frozenCategory.upsert({
            where: { brandId_slug: { brandId: BRAND_ID, slug: cat.slug } },
            update: {},
            create: {
                brand: { connect: { id: BRAND_ID } },
                name: cat.name,
                slug: cat.slug,
                isActive: true
            }
        });
        categories[cat.slug] = c.id;
    }

    // 2. PRODUCTS (Menu Items)
    console.log('Seeding Menu Items...');
    const productData = [
        { name: 'Nasi Goreng Spesial', slug: 'nasi-goreng-spesial', categoryId: categories['makanan-utama'], price: 35000 },
        { name: 'Ayam Bakar Madu', slug: 'ayam-bakar-madu', categoryId: categories['makanan-utama'], price: 45000 },
        { name: 'Es Teh Manis', slug: 'es-teh-manis', categoryId: categories['minuman-segar'], price: 8000 },
        { name: 'Kopi Susu Gula Aren', slug: 'kopi-susu-gula-aren', categoryId: categories['minuman-segar'], price: 18000 },
        { name: 'Kentang Goreng Platters', slug: 'kentang-goreng-platters', categoryId: categories['camilan-gurih'], price: 25000 }
    ];

    for (const prod of productData) {
        const p = await prisma.frozenProduct.upsert({
            where: { slug: prod.slug },
            update: { categoryId: prod.categoryId, inventoryType: 'FINISHED_GOOD' },
            create: {
                name: prod.name,
                slug: prod.slug,
                categoryId: prod.categoryId,
                description: `Menu dummy untuk ${prod.name}`,
                storageType: 'READY_TO_EAT',
                inventoryType: 'FINISHED_GOOD'
            }
        });

        await prisma.frozenVariant.upsert({
            where: { sku: `MENU-${prod.slug.toUpperCase().replace(/-/g, '_')}` },
            update: { price: prod.price },
            create: {
                productId: p.id,
                name: 'Normal',
                sku: `MENU-${prod.slug.toUpperCase().replace(/-/g, '_')}`,
                price: prod.price,
                weight: 0.5,
                unit: 'porsi',
                stockOnHand: 50
            }
        });
    }

    // 3. WAREHOUSES
    console.log('Seeding Warehouses...');
    const whStorage = await prisma.warehouse.upsert({
        where: { brandId_name: { brandId: BRAND_ID, name: 'Gudang Bahan Dasar' } },
        update: {},
        create: {
            brand: { connect: { id: BRAND_ID } },
            name: 'Gudang Bahan Dasar',
            address: 'Jl. Gudang No. 2, Jakarta',
            isDefault: false
        }
    });

    // 4. LEDGER ACCOUNTS
    console.log('Seeding Ledger Accounts...');
    const accounts = [
        { code: '1111', name: 'Kas Besar', type: 'ASSET' },
        { code: '1112', name: 'BCA - Operasional', type: 'ASSET' },
        { code: '4111', name: 'Pendapatan Penjualan', type: 'REVENUE' },
        { code: '5111', name: 'HPP Makanan', type: 'EXPENSE' },
        { code: '6111', name: 'Biaya Sewa & Listrik', type: 'EXPENSE' }
    ];

    for (const acc of accounts) {
        await prisma.ledgerAccount.upsert({
            where: { brandId_code: { brandId: BRAND_ID, code: acc.code } },
            update: { name: acc.name, type: acc.type },
            create: { brand: { connect: { id: BRAND_ID } }, ...acc }
        });
    }

    // 5. INVENTORY CATEGORY
    console.log('Seeding Inventory Categories...');
    const invCatRaw = await prisma.inventoryCategory.upsert({
        where: { brandId_slug: { brandId: BRAND_ID, slug: 'bahan-baku' } },
        update: {},
        create: {
            brand: { connect: { id: BRAND_ID } },
            name: 'Bahan Baku',
            slug: 'bahan-baku',
            type: 'RAW_MATERIAL'
        }
    });

    // 6. RAW MATERIALS (Raw Products)
    console.log('Seeding Raw Materials...');
    const rawMaterials = [
        { name: 'Beras Premium', slug: 'raw-beras', unit: 'kg', costPrice: 15000 },
        { name: 'Ayam Karkas 1kg', slug: 'raw-ayam', unit: 'pcs', costPrice: 35000 },
        { name: 'Minyak Goreng 1L', slug: 'raw-minyak', unit: 'liter', costPrice: 18000 }
    ];

    const rawVariantIds = {};
    for (const raw of rawMaterials) {
        const p = await prisma.frozenProduct.upsert({
            where: { slug: raw.slug },
            update: {},
            create: {
                name: raw.name,
                slug: raw.slug,
                storageType: 'CHILLED',
                inventoryCategoryId: invCatRaw.id,
                inventoryType: 'RAW_MATERIAL'
            }
        });

        const v = await prisma.frozenVariant.upsert({
            where: { sku: `RAW-${raw.slug.toUpperCase()}` },
            update: { costPrice: raw.costPrice },
            create: {
                productId: p.id,
                name: 'Default',
                sku: `RAW-${raw.slug.toUpperCase()}`,
                price: 0,
                costPrice: raw.costPrice,
                weight: 1,
                unit: raw.unit,
                stockOnHand: 100
            }
        });
        rawVariantIds[raw.name] = v.id;

        // Initial Stock Batch
        await prisma.inventoryBatch.create({
            data: {
                variant: { connect: { id: v.id } },
                warehouse: { connect: { id: whStorage.id } },
                batchCode: `INIT-${raw.slug.toUpperCase()}`,
                quantity: 100,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
    }

    // 7. BRAND CONFIG
    console.log('Updating Brand Config...');
    await prisma.brandConfig.upsert({
        where: { brandId: BRAND_ID },
        update: {
            operationalOverhead: 15000000,
            targetMonthlyVolume: 500,
            overheadBreakdown: [
                { label: 'Gaji Karyawan', amount: 8000000 },
                { label: 'Sewa Tempat', amount: 4000000 },
                { label: 'Listrik & Air', amount: 3000000 }
            ]
        },
        create: {
            brand: { connect: { id: BRAND_ID } },
            operationalOverhead: 15000000,
            targetMonthlyVolume: 500,
            overheadBreakdown: [
                { label: 'Gaji Karyawan', amount: 8000000 },
                { label: 'Sewa Tempat', amount: 4000000 },
                { label: 'Listrik & Air', amount: 3000000 }
            ]
        }
    });

    console.log('--- SEEDING COMPLETED FOR ID: cmjx4dhk6000014nb6hwd1umu ---');
}

main().finally(() => prisma.$disconnect());
