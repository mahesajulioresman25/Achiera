import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleProducts() {
    try {
        console.log('🔍 Checking for existing products...');

        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            console.log('❌ Brand "merch" not found. Please create brand first.');
            return;
        }

        console.log(`✅ Found brand: ${brand.name}`);

        // Ensure we have a collection
        let collection = await prisma.merchCollection.findFirst({
            where: { brandId: brand.id }
        });

        if (!collection) {
            console.log('Creating default collection...');
            collection = await prisma.merchCollection.create({
                data: {
                    brandId: brand.id,
                    name: 'Default Collection',
                    slug: 'default-collection',
                    heroTitle: 'Our Collection',
                    heroSubtitle: 'Discover our premium products'
                }
            });
        }

        // Check existing products
        const existingProducts = await prisma.product.findMany({
            where: { collectionId: collection.id }
        });

        console.log(`📦 Existing products: ${existingProducts.length}`);

        if (existingProducts.length > 0) {
            console.log('\n✅ Products already exist:');
            existingProducts.forEach(p => {
                console.log(`   - ${p.name} (${p.slug})`);
            });
            console.log('\nNo need to create sample products.');
            return;
        }

        console.log('\n📝 Creating sample products...\n');

        // Create sample products
        const products = [
            {
                slug: 'tote-bag-canvas',
                name: 'Tote Bag Canvas',
                productType: 'Bag',
                description: 'Premium canvas tote bag, perfect for daily use',
                variants: [
                    {
                        name: 'Natural',
                        sku: 'TOTE-CANVAS-NAT',
                        basePrice: 50000,
                        attributes: { color: 'Natural' }
                    },
                    {
                        name: 'Black',
                        sku: 'TOTE-CANVAS-BLK',
                        basePrice: 55000,
                        attributes: { color: 'Black' }
                    }
                ]
            },
            {
                slug: 'tumbler-stainless',
                name: 'Tumbler Stainless',
                productType: 'Drinkware',
                description: 'Stainless steel tumbler with custom print',
                variants: [
                    {
                        name: 'Silver',
                        sku: 'TUMBLER-SS-SLV',
                        basePrice: 75000,
                        attributes: { color: 'Silver' }
                    },
                    {
                        name: 'Black',
                        sku: 'TUMBLER-SS-BLK',
                        basePrice: 75000,
                        attributes: { color: 'Black' }
                    }
                ]
            }
        ];

        for (const productData of products) {
            const { variants, ...pData } = productData;

            console.log(`Creating: ${pData.name}...`);

            const product = await prisma.product.create({
                data: {
                    ...pData,
                    collectionId: collection.id,
                }
            });

            console.log(`✅ Created product: ${product.name}`);

            // Create variants
            for (const variantData of variants) {
                const variant = await prisma.productVariant.create({
                    data: {
                        ...variantData,
                        productId: product.id,
                    }
                });

                console.log(`   ✅ Created variant: ${variant.name} (Rp ${variant.basePrice.toNumber().toLocaleString('id-ID')})`);
            }

            console.log('');
        }

        console.log('🎉 Sample products created successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleProducts();
