import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupBrandAndProducts() {
    try {
        console.log('🚀 Setting up ACHIERA platform...\n');

        // Step 1: Create or get brands
        console.log('📦 Step 1: Setting up brands...');

        let merchBrand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!merchBrand) {
            merchBrand = await prisma.brand.create({
                data: {
                    slug: 'merch',
                    name: 'ACHIERA Merch',
                    paymentSettings: {
                        downPaymentPercentage: 50
                    }
                }
            });
            console.log('✅ Created brand: ACHIERA Merch');
        } else {
            console.log('✅ Brand already exists: ACHIERA Merch');
        }

        // Step 2: Check for existing products
        console.log('\n📦 Step 2: Checking for products...');

        const existingProducts = await prisma.mockupProductTemplate.findMany({
            where: { brandId: merchBrand.id },
            include: {
                _count: {
                    select: { variants: true }
                }
            }
        });

        if (existingProducts.length > 0) {
            console.log(`✅ Found ${existingProducts.length} existing products:`);
            existingProducts.forEach(p => {
                console.log(`   - ${p.displayName} (${p._count.variants} variants)`);
            });
            console.log('\n✅ Setup complete! Products already exist.');
            return;
        }

        // Step 3: Create sample products
        console.log('\n📦 Step 3: Creating sample products...\n');

        const products = [
            {
                slug: 'tote-bag-canvas',
                displayName: 'Tote Bag Canvas',
                productType: 'Bag',
                description: 'Premium canvas tote bag, perfect for daily use and custom branding',
                canvasWidth: 2000,
                canvasHeight: 2000,
                variants: [
                    {
                        name: 'Natural',
                        colorHex: '#F5F5DC',
                        price: 50000,
                        safeZoneX: 500,
                        safeZoneY: 600,
                        safeZoneWidth: 1000,
                        safeZoneHeight: 800
                    },
                    {
                        name: 'Black',
                        colorHex: '#1a1a1a',
                        price: 55000,
                        safeZoneX: 500,
                        safeZoneY: 600,
                        safeZoneWidth: 1000,
                        safeZoneHeight: 800
                    }
                ]
            },
            {
                slug: 'tumbler-stainless',
                displayName: 'Tumbler Stainless',
                productType: 'Drinkware',
                description: 'Stainless steel tumbler with custom print, keeps drinks hot or cold',
                canvasWidth: 2000,
                canvasHeight: 2000,
                variants: [
                    {
                        name: 'Silver',
                        colorHex: '#C0C0C0',
                        price: 75000,
                        safeZoneX: 600,
                        safeZoneY: 700,
                        safeZoneWidth: 800,
                        safeZoneHeight: 600
                    },
                    {
                        name: 'Black',
                        colorHex: '#1a1a1a',
                        price: 75000,
                        safeZoneX: 600,
                        safeZoneY: 700,
                        safeZoneWidth: 800,
                        safeZoneHeight: 600
                    },
                    {
                        name: 'White',
                        colorHex: '#FFFFFF',
                        price: 75000,
                        safeZoneX: 600,
                        safeZoneY: 700,
                        safeZoneWidth: 800,
                        safeZoneHeight: 600
                    }
                ]
            },
            {
                slug: 't-shirt-cotton',
                displayName: 'T-Shirt Cotton',
                productType: 'Apparel',
                description: 'Premium cotton t-shirt with custom design, comfortable and durable',
                canvasWidth: 2000,
                canvasHeight: 2000,
                variants: [
                    {
                        name: 'White',
                        colorHex: '#FFFFFF',
                        price: 45000,
                        safeZoneX: 600,
                        safeZoneY: 500,
                        safeZoneWidth: 800,
                        safeZoneHeight: 1000
                    },
                    {
                        name: 'Black',
                        colorHex: '#1a1a1a',
                        price: 45000,
                        safeZoneX: 600,
                        safeZoneY: 500,
                        safeZoneWidth: 800,
                        safeZoneHeight: 1000
                    },
                    {
                        name: 'Navy',
                        colorHex: '#000080',
                        price: 45000,
                        safeZoneX: 600,
                        safeZoneY: 500,
                        safeZoneWidth: 800,
                        safeZoneHeight: 1000
                    }
                ]
            }
        ];

        for (const productData of products) {
            const { variants, ...templateData } = productData;

            console.log(`Creating: ${templateData.displayName}...`);

            const template = await prisma.mockupProductTemplate.create({
                data: {
                    ...templateData,
                    brandId: merchBrand.id,
                    hasVariants: true
                }
            });

            console.log(`✅ Created template: ${template.displayName}`);

            // Create variants
            for (const variantData of variants) {
                const variant = await prisma.mockupVariant.create({
                    data: {
                        ...variantData,
                        templateId: template.id,
                        baseImageUrl: `/images/products/${productData.slug}-${variantData.name.toLowerCase()}.png`,
                        tintMaskUrl: `/images/products/${productData.slug}-mask.png`
                    }
                });

                console.log(`   ✅ Variant: ${variant.name} - Rp ${variant.price.toLocaleString('id-ID')}`);
            }

            console.log('');
        }

        console.log('🎉 Setup complete!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ Brand created: ACHIERA Merch');
        console.log('✅ Products created: 3 templates, 8 variants');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📝 Next steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Go to: Dashboard → Collections → [Collection] → Products');
        console.log('   3. Click "Add Product" - dropdown should now have products!');
        console.log('   4. (Optional) Upload product images to /public/images/products/\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupBrandAndProducts();
