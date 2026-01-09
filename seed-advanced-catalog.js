const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx3qor60000jp954nkba43d';

async function main() {
    console.log('--- START ADVANCED SEEDING FOR RASA IBU ---');

    // 1. WAREHOUSES
    console.log('Seeding Warehouses...');
    const whMain = await prisma.warehouse.upsert({
        where: { brandId_name: { brandId: BRAND_ID, name: 'Dapur Utama' } },
        update: {},
        create: {
            brand: { connect: { id: BRAND_ID } },
            name: 'Dapur Utama',
            address: 'Jl. Rasa Ibu No. 1, Jakarta',
            isDefault: true
        }
    });

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

    // 2. LEDGER ACCOUNTS
    console.log('Seeding Ledger Accounts...');
    const accounts = [
        { code: '1111', name: 'Kas Besar', type: 'ASSET' },
        { code: '1112', name: 'BCA - Operasional', type: 'ASSET' },
        { code: '4111', name: 'Pendapatan Penjualan', type: 'REVENUE' },
        { code: '5111', name: 'HPP Makanan', type: 'EXPENSE' },
        { code: '6111', name: 'Biaya Sewa & Listrik', type: 'EXPENSE' },
        { code: '6112', name: 'Gaji Karyawan', type: 'EXPENSE' }
    ];

    for (const acc of accounts) {
        await prisma.ledgerAccount.upsert({
            where: { brandId_code: { brandId: BRAND_ID, code: acc.code } },
            update: { name: acc.name, type: acc.type },
            create: {
                brand: { connect: { id: BRAND_ID } },
                code: acc.code,
                name: acc.name,
                type: acc.type
            }
        });
    }

    // 3. BANK ACCOUNTS
    console.log('Seeding Bank Accounts...');
    await prisma.bankAccount.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.bankAccount.create({
        data: {
            brand: { connect: { id: BRAND_ID } },
            bankName: 'BCA',
            accountNumber: '1234567890',
            accountHolder: 'Rasa Ibu Operasional',
            isActive: true
        }
    });

    // 4. INVENTORY CATEGORY (Internal)
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

    // 5. RAW MATERIALS (Products)
    console.log('Seeding Raw Materials...');
    const rawMaterials = [
        { name: 'Beras Premium', slug: 'beras-premium', unit: 'kg', costPrice: 15000 },
        { name: 'Ayam Karkas 1kg', slug: 'ayam-karkas', unit: 'pcs', costPrice: 35000 },
        { name: 'Minyak Goreng 1L', slug: 'minyak-goreng', unit: 'liter', costPrice: 18000 },
        { name: 'Telur Ayam 1kg', slug: 'telur-ayam', unit: 'kg', costPrice: 28000 },
        { name: 'Bumbu Dasar Merah', slug: 'bumbu-merah', unit: 'gram', costPrice: 100 }
    ];

    const rawVariantIds = {};

    for (const raw of rawMaterials) {
        const p = await prisma.frozenProduct.upsert({
            where: { slug: raw.slug },
            update: { inventoryCategoryId: invCatRaw.id, inventoryType: 'RAW_MATERIAL' },
            create: {
                name: raw.name,
                slug: raw.slug,
                storageType: 'CHILLED',
                inventoryCategoryId: invCatRaw.id,
                inventoryType: 'RAW_MATERIAL',
                description: `Bahan baku ${raw.name}`
            }
        });

        const sku = `RM-${raw.slug.toUpperCase().replace(/-/g, '_')}`;
        const v = await prisma.frozenVariant.upsert({
            where: { sku },
            update: { costPrice: raw.costPrice, unit: raw.unit },
            create: {
                productId: p.id,
                name: 'Default',
                sku,
                price: 0,
                costPrice: raw.costPrice,
                weight: 1,
                unit: raw.unit,
                stockOnHand: 100
            }
        });
        rawVariantIds[raw.name] = v.id;

        // Seed Initial Batch
        await prisma.inventoryBatch.create({
            data: {
                variant: { connect: { id: v.id } },
                warehouse: { connect: { id: whStorage.id } },
                batchCode: `INIT-${raw.slug.toUpperCase().replace(/-/g, '_')}`,
                quantity: 100,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
    }

    // 6. RECIPES
    console.log('Seeding Recipes...');
    const menuItems = await prisma.frozenProduct.findMany({
        where: { inventoryType: 'FINISHED_GOOD', category: { brand: { id: BRAND_ID } } },
        include: { variants: true }
    });

    for (const item of menuItems) {
        const variant = item.variants[0];
        if (!variant) continue;

        // Delete existing recipe and items to avoid conflicts
        const existing = await prisma.recipe.findFirst({ where: { frozenVariantId: variant.id } });
        if (existing) {
            await prisma.recipeItem.deleteMany({ where: { recipeId: existing.id } });
            await prisma.recipe.delete({ where: { id: existing.id } });
        }

        const recipe = await prisma.recipe.create({
            data: {
                brand: { connect: { id: BRAND_ID } },
                name: `Resep ${item.name}`,
                frozenVariant: { connect: { id: variant.id } }, // Use relation
                outputQuantity: 1
            }
        });

        // Add generic ingredients
        const ingredients = [
            { name: 'Beras Premium', qty: 0.2, unit: 'kg' },
            { name: 'Telur Ayam 1kg', qty: 0.05, unit: 'kg' },
            { name: 'Bumbu Dasar Merah', qty: 30, unit: 'gram' }
        ];

        for (const ing of ingredients) {
            if (rawVariantIds[ing.name]) {
                await prisma.recipeItem.create({
                    data: {
                        recipe: { connect: { id: recipe.id } },
                        ingredient: { connect: { id: rawVariantIds[ing.name] } }, // Use relation
                        quantity: ing.qty,
                        unit: ing.unit
                    }
                });
            }
        }
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
                { label: 'Listrik & Air', amount: 2000000 },
                { label: 'Pemasaran', amount: 1000000 }
            ],
            marketplaceFeeRate: 0.15,
            targetNetMarginRate: 0.30
        },
        create: {
            brand: { connect: { id: BRAND_ID } },
            operationalOverhead: 15000000,
            targetMonthlyVolume: 500,
            overheadBreakdown: [
                { label: 'Gaji Karyawan', amount: 8000000 },
                { label: 'Sewa Tempat', amount: 4000000 },
                { label: 'Listrik & Air', amount: 2000000 },
                { label: 'Pemasaran', amount: 1000000 }
            ],
            marketplaceFeeRate: 0.15,
            targetNetMarginRate: 0.30
        }
    });

    console.log('--- ADVANCED SEEDING COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
