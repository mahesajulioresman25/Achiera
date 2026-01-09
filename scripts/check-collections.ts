import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCollections() {
    try {
        console.log('🔍 Checking collections in database...\n');

        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            console.log('❌ Brand "merch" not found!');
            console.log('Run setup-platform.ts first to create brand.');
            return;
        }

        console.log(`✅ Brand found: ${brand.name} (${brand.slug})\n`);

        // Get all collections
        const collections = await prisma.merchCollection.findMany({
            where: { brandId: brand.id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (collections.length === 0) {
            console.log('📦 No collections found.\n');
            console.log('Creating sample collection "test"...\n');

            const newCollection = await prisma.merchCollection.create({
                data: {
                    brandId: brand.id,
                    slug: 'test',
                    name: 'Test Collection',
                    heroTitle: 'Test Collection',
                    heroSubtitle: 'Explore our curated selection of premium merchandise',
                    highlights: [],
                    whatsInside: [],
                    designOptions: [],
                    materialPoints: [],
                    useCases: [],
                    packagingOptions: [],
                    faq: [],
                    galleryImages: []
                }
            });

            console.log(`✅ Created collection: ${newCollection.name} (slug: ${newCollection.slug})`);
            console.log(`   ID: ${newCollection.id}\n`);
        } else {
            console.log(`📦 Found ${collections.length} collection(s):\n`);
            collections.forEach(c => {
                console.log(`   - ${c.name}`);
                console.log(`     Slug: ${c.slug}`);
                console.log(`     Products: ${c._count.products}`);
                console.log(`     ID: ${c.id}\n`);
            });
        }

        // Get all products
        const products = await prisma.product.findMany({
            where: { collection: { brandId: brand.id } },
            include: {
                _count: {
                    select: { variants: true }
                }
            }
        });

        console.log(`📦 Found ${products.length} product(s):\n`);
        products.forEach(p => {
            console.log(`   - ${p.name} (${p.slug})`);
            console.log(`     Variants: ${p._count.variants}`);
            console.log(`     ID: ${p.id}\n`);
        });

        // Collection products are directly linked in current schema
        console.log(`🔗 Products linked to collections via direct relation.\n`);


    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCollections();
