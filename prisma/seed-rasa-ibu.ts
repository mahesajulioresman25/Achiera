import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CHART_OF_ACCOUNTS = [
    // ASSETS (1-xxxx)
    { code: '1-1000', name: 'Kas', type: 'ASSET' },
    { code: '1-1100', name: 'Bank BCA', type: 'ASSET' },
    { code: '1-1101', name: 'Bank Mandiri', type: 'ASSET' },
    { code: '1-1200', name: 'Piutang Usaha', type: 'ASSET' },
    { code: '1-1300', name: 'Persediaan Barang', type: 'ASSET' },
    { code: '1-1400', name: 'Perlengkapan', type: 'ASSET' },
    { code: '1-2000', name: 'Peralatan Dapur', type: 'ASSET' },
    { code: '1-2100', name: 'Akumulasi Penyusutan Peralatan', type: 'ASSET' },

    // LIABILITIES (2-xxxx)
    { code: '2-1000', name: 'Hutang Usaha', type: 'LIABILITY' },
    { code: '2-1100', name: 'Hutang Gaji', type: 'LIABILITY' },
    { code: '2-1200', name: 'Hutang Pajak', type: 'LIABILITY' },

    // EQUITY (3-xxxx)
    { code: '3-1000', name: 'Modal Pemilik', type: 'EQUITY' },
    { code: '3-1100', name: 'Prive Pemilik', type: 'EQUITY' },
    { code: '3-2000', name: 'Laba Ditahan', type: 'EQUITY' },
    { code: '3-3000', name: 'Laba Tahun Berjalan', type: 'EQUITY' },

    // REVENUE (4-xxxx)
    { code: '4-1000', name: 'Pendapatan Penjualan', type: 'REVENUE' },
    { code: '4-2000', name: 'Pendapatan Lain-lain', type: 'REVENUE' },
    { code: '4-3000', name: 'Diskon Penjualan', type: 'REVENUE' },

    // EXPENSES (5-xxxx)
    { code: '5-1000', name: 'Harga Pokok Penjualan', type: 'EXPENSE' },
    { code: '5-2000', name: 'Biaya Gaji', type: 'EXPENSE' },
    { code: '5-3000', name: 'Biaya Operasional', type: 'EXPENSE' },
    { code: '5-3100', name: 'Biaya Marketing', type: 'EXPENSE' },
    { code: '5-3200', name: 'Biaya Sewa', type: 'EXPENSE' },
    { code: '5-4000', name: 'Biaya Listrik & Air', type: 'EXPENSE' },
    { code: '5-5000', name: 'Biaya Transportasi', type: 'EXPENSE' },
    { code: '5-6000', name: 'Biaya Administrasi Bank', type: 'EXPENSE' },
    { code: '5-9000', name: 'Biaya Lain-lain', type: 'EXPENSE' },
];

async function main() {
    console.log('🌱 Starting Rasa Ibu brand restoration seed (Self-Contained)...');

    const paymentSettings = {
        marketplaceFees: {
            WHATSAPP: 0,
            SHOPEE: 15,
            GRAB_FOOD: 25,
            GO_FOOD: 25,
            TIKTOK_SHOP: 12
        },
        campaignFees: {},
        taxRates: {
            PPN: 11,
            PPH: 0.5
        },
        operationalOverhead: 5000,
        dailyKitchenOverhead: 150000,
        qrisEnabled: true,
        qrisImageUrl: 'https://placehold.co/400x400/png?text=QRIS+RASA+IBU',
        bankName: 'BCA',
        accountNumber: '8000818181',
        accountHolder: 'RASA IBU - ACHIERA'
    };

    // 1. Create or Find Brand
    const brand = await prisma.brand.upsert({
        where: { slug: 'rasa-ibu' },
        update: {
            paymentSettings: paymentSettings
        },
        create: {
            slug: 'rasa-ibu',
            name: 'Rasa Ibu',
            isActive: true,
            paymentSettings: paymentSettings
        },
    });
    console.log('✅ Brand registered: Rasa Ibu (' + brand.id + ')');

    // 1b. Create or Update Brand Config
    console.log('⚙️ Seeding Brand Config...');
    await prisma.brandConfig.upsert({
        where: { brandId: brand.id },
        update: {
            publicTitle: 'Rasa Ibu',
            publicSubtitle: 'Masakan rumah siap saji, dibuat dengan penuh cinta.',
            publicNavLinks: [
                { label: 'Home', href: '/rasa-ibu' },
                { label: 'Produk', href: '/rasa-ibu/products' },
                { label: 'Cek Poin', href: '/rasa-ibu/loyalty' },
                { label: 'Cara Pesan', href: '/rasa-ibu/how-to-order' },
                { label: 'Tentang Kami', href: '/rasa-ibu/about' }
            ],
            heroTagline: 'HANGATNYA MEJA MAKAN',
            heroImage: '/images/rasa-ibu/hero.jpg',
            howToOrderCtaTitle: 'Mari Hadirkan Kehangatan di Meja Makan Bunda',
            howToOrderCtaPrimary: 'Lihat Menu Cinta Kami',
            howToOrderCtaSecondary: 'Tanya Bunda Soal Pengiriman'
        },
        create: {
            brandId: brand.id,
            publicTitle: 'Rasa Ibu',
            publicSubtitle: 'Masakan rumah siap saji, dibuat dengan penuh cinta.',
            publicNavLinks: [
                { label: 'Home', href: '/rasa-ibu' },
                { label: 'Produk', href: '/rasa-ibu/products' },
                { label: 'Cek Poin', href: '/rasa-ibu/loyalty' },
                { label: 'Cara Pesan', href: '/rasa-ibu/how-to-order' },
                { label: 'Tentang Kami', href: '/rasa-ibu/about' }
            ],
            heroTagline: 'HANGATNYA MEJA MAKAN',
            heroImage: '/images/rasa-ibu/hero.jpg',
            howToOrderCtaTitle: 'Mari Hadirkan Kehangatan di Meja Makan Bunda',
            howToOrderCtaPrimary: 'Lihat Menu Cinta Kami',
            howToOrderCtaSecondary: 'Tanya Bunda Soal Pengiriman'
        }
    });
    console.log('✅ Brand Config seeded.');

    // 2. Initialize Chart of Accounts
    console.log('📊 Initializing Chart of Accounts...');
    let createdCount = 0;
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
        const existingAcc = await prisma.ledgerAccount.findUnique({
            where: {
                brandId_code: {
                    brandId: brand.id,
                    code: account.code
                }
            }
        });

        if (!existingAcc) {
            await prisma.ledgerAccount.create({
                data: {
                    brandId: brand.id,
                    code: account.code,
                    name: account.name,
                    type: account.type as any,
                    balance: 0
                }
            });
            createdCount++;
        }
    }
    console.log(`✅ CoA Initialization Complete. Created: ${createdCount} accounts.`);

    // 3. Assign Super Admin Role
    const superAdmin = await prisma.user.findUnique({
        where: { email: 'super@achiera.com' }
    });

    if (superAdmin) {
        await prisma.userBrandRole.upsert({
            where: {
                userId_brandId: {
                    userId: superAdmin.id,
                    brandId: brand.id,
                },
            },
            update: {},
            create: {
                userId: superAdmin.id,
                brandId: brand.id,
                role: 'BRAND_ADMIN',
            },
        });
        console.log('✅ Role assigned: Super Admin for Rasa Ibu');
    }

    // 4. Seed Business Categories (Frozen Food)
    console.log('📦 Seeding Business Categories...');

    const category = await prisma.frozenCategory.upsert({
        where: {
            brandId_slug: {
                brandId: brand.id,
                slug: 'frozen-food'
            }
        },
        update: {},
        create: {
            brandId: brand.id,
            name: 'Frozen Food',
            slug: 'frozen-food',
            // Removed title/description as they are not in schema
        }
    });

    const product = await prisma.frozenProduct.upsert({
        where: { slug: 'sample-frozen-product' },
        update: {},
        create: {
            categoryId: category.id,
            name: 'Sample Frozen Item',
            slug: 'sample-frozen-product',
            description: 'Sample product for initialization',
            storageType: 'FROZEN' // Required field
        }
    });

    const variant = await prisma.frozenVariant.upsert({
        where: { sku: 'SAMPLE-V1' },
        update: {},
        create: {
            productId: product.id,
            name: 'Reguler',
            sku: 'SAMPLE-V1',
            price: 50000,
            costPrice: 35000,
            stockOnHand: 100, // Corrected from 'stock'
            weight: 0.5, // Required Decimal field
        }
    });

    // 5. Seed Default Warehouse
    console.log('🏗️ Seeding Default Warehouse...');
    const warehouse = await prisma.warehouse.upsert({
        where: {
            brandId_name: {
                brandId: brand.id,
                name: 'Dapur Utama'
            }
        },
        update: {},
        create: {
            brandId: brand.id,
            name: 'Dapur Utama',
            address: 'Jakarta, Indonesia',
            isDefault: true
        }
    });

    // 6. Seed Initial Inventory Batch (FIFO)
    console.log('📦 Seeding Inventory Batches...');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await prisma.inventoryBatch.create({
        data: {
            warehouseId: warehouse.id,
            variantId: variant.id,
            batchCode: 'BATCH-INIT-001',
            quantity: 100,
            expiryDate: expiryDate,
            receivedAt: new Date()
        }
    });

    console.log('\n🎉 Rasa Ibu brand restoration seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
