import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreBrandsAndHolding() {
    console.log('🔄 Starting brand and holding restoration...\n');

    try {
        // 1. Check existing brands
        const existingBrands = await prisma.brand.findMany({
            select: { id: true, slug: true, name: true }
        });

        console.log('📊 Existing brands:');
        existingBrands.forEach(b => console.log(`  - ${b.name} (${b.slug})`));
        console.log('');

        // 2. Create Rasa Ibu brand if not exists
        const rasaIbuSlug = 'rasa-ibu';
        let rasaIbu = existingBrands.find(b => b.slug === rasaIbuSlug);

        if (!rasaIbu) {
            console.log('✨ Creating Rasa Ibu brand...');
            rasaIbu = await prisma.brand.create({
                data: {
                    slug: rasaIbuSlug,
                    name: 'Rasa Ibu',
                    isActive: true
                }
            });
            console.log(`✅ Rasa Ibu created with ID: ${rasaIbu.id}\n`);
        } else {
            console.log(`✅ Rasa Ibu already exists with ID: ${rasaIbu.id}\n`);
        }

        // 3. Create BrandConfig for Rasa Ibu if not exists
        const existingConfig = await prisma.brandConfig.findUnique({
            where: { brandId: rasaIbu.id }
        });

        if (!existingConfig) {
            console.log('⚙️  Creating BrandConfig for Rasa Ibu...');
            await prisma.brandConfig.create({
                data: {
                    brandId: rasaIbu.id,
                    publicTitle: 'Rasa Ibu - Hangatnya Meja Makan',
                    publicSubtitle: 'Frozen food berkualitas dengan rasa rumahan',
                    heroTagline: 'HANGATNYA MEJA MAKAN',
                    philosophyTitle: 'Filosofi Rasa',
                    philosophyContent: 'Setiap hidangan dibuat dengan cinta, seperti masakan ibu di rumah.',
                    featuredSectionTitle: 'Menu Favorit Keluarga',
                    platformSectionTitle: 'Tersedia di Platform Kesukaan Bunda',
                    ctaSectionTitle: 'Siap Menjamu Keluarga Hari Ini?',
                    defaultOverheadPerUnit: 2000,
                    targetMonthlyVolume: 100,
                    marketplaceFeeRate: 0.15,
                    targetNetMarginRate: 0.30
                }
            });
            console.log('✅ BrandConfig created\n');
        } else {
            console.log('✅ BrandConfig already exists\n');
        }

        // 4. Create default category for Rasa Ibu if not exists
        const existingCategory = await prisma.frozenCategory.findFirst({
            where: { brandId: rasaIbu.id }
        });

        if (!existingCategory) {
            console.log('📁 Creating default category...');
            await prisma.frozenCategory.create({
                data: {
                    brandId: rasaIbu.id,
                    name: 'Menu Utama',
                    slug: 'menu-utama'
                }
            });
            console.log('✅ Default category created\n');
        } else {
            console.log('✅ Category already exists\n');
        }

        // 5. Create default warehouse if not exists
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: { brandId: rasaIbu.id }
        });

        if (!existingWarehouse) {
            console.log('🏭 Creating default warehouse...');
            await prisma.warehouse.create({
                data: {
                    brandId: rasaIbu.id,
                    name: 'Gudang Utama',
                    isDefault: true,
                    address: 'Dapur Rasa Ibu'
                }
            });
            console.log('✅ Default warehouse created\n');
        } else {
            console.log('✅ Warehouse already exists\n');
        }

        console.log('🎉 Brand restoration completed!\n');
        console.log('📋 Summary:');
        console.log(`  Brand: ${rasaIbu.name}`);
        console.log(`  Slug: ${rasaIbu.slug}`);
        console.log(`  ID: ${rasaIbu.id}`);
        console.log('');
        console.log('✅ You can now access Rasa Ibu dashboard at:');
        console.log(`   /dashboard/${rasaIbu.slug}`);

    } catch (error) {
        console.error('❌ Error during restoration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

restoreBrandsAndHolding()
    .catch(console.error);
