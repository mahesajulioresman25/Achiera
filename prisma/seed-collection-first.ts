import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with Collection-First architecture...\n');

    // 1. Create Brand
    console.log('📦 Creating brand...');
    const brand = await prisma.brand.upsert({
        where: { slug: 'merch' },
        update: {},
        create: {
            slug: 'merch',
            name: 'ACHIERA Merch',
            paymentSettings: { downPaymentPercentage: 50 },
            isActive: true
        }
    });
    console.log(`✅ Brand created: ${brand.name}\n`);

    // 2. Create Collections
    console.log('📚 Creating collections...');

    const toteBagCollection = await prisma.merchCollection.create({
        data: {
            brandId: brand.id,
            slug: 'tote-bags',
            name: 'Tote Bag Collection',
            description: 'Premium canvas tote bags perfect for custom designs',
            visibility: 'published',
            status: 'active',
            heroTitle: 'Premium Tote Bags',
            heroSubtitle: 'Eco-friendly canvas bags for your custom designs',
            highlights: ['100% Canvas', 'Eco-friendly', 'Durable', 'Multiple sizes'],
            whatsInside: ['High-quality canvas material', 'Reinforced handles', 'Large print area'],
            designOptions: ['DTF Printing', 'DTG Printing', 'Screen Printing'],
            materialPoints: ['12oz Canvas', 'Natural color', 'Washable'],
            useCases: [
                { title: 'Corporate Gifts', description: 'Perfect for company events and giveaways' },
                { title: 'Retail Merchandise', description: 'Sell custom designed tote bags' },
                { title: 'Event Souvenirs', description: 'Memorable keepsakes for special occasions' }
            ],
            packagingOptions: ['Individual poly bag', 'Bulk packaging', 'Custom branded packaging'],
            faq: [
                { question: 'What printing methods are available?', answer: 'We offer DTF, DTG, and screen printing' },
                { question: 'What is the minimum order?', answer: 'Minimum order is 10 pieces' }
            ],
            galleryImages: [],
            displayOrder: 1
        }
    });

    const apparelCollection = await prisma.merchCollection.create({
        data: {
            brandId: brand.id,
            slug: 'apparel',
            name: 'Apparel Collection',
            description: 'High-quality t-shirts and hoodies for custom printing',
            visibility: 'published',
            status: 'active',
            heroTitle: 'Custom Apparel',
            heroSubtitle: 'Premium quality clothing for your designs',
            highlights: ['100% Cotton', 'Soft & Comfortable', 'Various sizes', 'Multiple colors'],
            whatsInside: ['Premium cotton fabric', 'Pre-shrunk', 'Durable stitching'],
            designOptions: ['DTF Printing', 'DTG Printing', 'Plastisol', 'Embroidery'],
            materialPoints: ['180gsm Cotton', 'Combed cotton', 'Colorfast'],
            useCases: [
                { title: 'Team Uniforms', description: 'Create matching team apparel' },
                { title: 'Brand Merchandise', description: 'Sell branded clothing' },
                { title: 'Event T-Shirts', description: 'Custom shirts for events' }
            ],
            packagingOptions: ['Individual folded', 'Bulk packaging'],
            faq: [
                { question: 'What sizes are available?', answer: 'S, M, L, XL, XXL' },
                { question: 'Can I mix sizes in one order?', answer: 'Yes, you can mix sizes' }
            ],
            galleryImages: [],
            displayOrder: 2
        }
    });

    const drinkwareCollection = await prisma.merchCollection.create({
        data: {
            brandId: brand.id,
            slug: 'drinkware',
            name: 'Drinkware Collection',
            description: 'Stainless steel tumblers and bottles for custom branding',
            visibility: 'published',
            status: 'active',
            heroTitle: 'Custom Drinkware',
            heroSubtitle: 'Premium tumblers and bottles',
            highlights: ['Stainless Steel', 'Double-walled', 'Temperature retention', 'Durable'],
            whatsInside: ['304 stainless steel', 'Vacuum insulated', 'Leak-proof lid'],
            designOptions: ['Laser Engraving', 'UV Printing', 'Sublimation'],
            materialPoints: ['Food-grade steel', 'BPA-free', 'Rust-resistant'],
            useCases: [
                { title: 'Corporate Gifts', description: 'Premium corporate giveaways' },
                { title: 'Promotional Items', description: 'Branded drinkware for marketing' }
            ],
            packagingOptions: ['Gift box', 'Individual box'],
            faq: [
                { question: 'How long does it keep drinks cold?', answer: 'Up to 24 hours cold, 12 hours hot' }
            ],
            galleryImages: [],
            displayOrder: 3
        }
    });

    console.log(`✅ Created ${3} collections\n`);

    // 3. Create Products
    console.log('🎨 Creating products...');

    // Tote Bag Products
    const toteBagA4 = await prisma.product.create({
        data: {
            collectionId: toteBagCollection.id,
            slug: 'canvas-tote-bag-a4',
            sku: 'TB-A4-001',
            name: 'Canvas Tote Bag A4',
            productType: 'tote-bag',
            description: 'Classic A4 size canvas tote bag perfect for everyday use',
            isCustomizable: true,
            isFeatured: true,
            status: 'active',
            displayOrder: 1
        }
    });

    const toteBagA3 = await prisma.product.create({
        data: {
            collectionId: toteBagCollection.id,
            slug: 'canvas-tote-bag-a3',
            sku: 'TB-A3-001',
            name: 'Canvas Tote Bag A3',
            productType: 'tote-bag',
            description: 'Large A3 size canvas tote bag for bigger designs',
            isCustomizable: true,
            isFeatured: false,
            status: 'active',
            displayOrder: 2
        }
    });

    // Apparel Products
    const tshirtCotton = await prisma.product.create({
        data: {
            collectionId: apparelCollection.id,
            slug: 't-shirt-cotton-basic',
            sku: 'TS-COT-001',
            name: 'Cotton T-Shirt Basic',
            productType: 't-shirt',
            description: '100% cotton t-shirt, soft and comfortable',
            isCustomizable: true,
            isFeatured: true,
            status: 'active',
            displayOrder: 1
        }
    });

    // Drinkware Products
    const tumblerSteel = await prisma.product.create({
        data: {
            collectionId: drinkwareCollection.id,
            slug: 'stainless-tumbler-500ml',
            sku: 'TM-SS-500',
            name: 'Stainless Steel Tumbler 500ml',
            productType: 'tumbler',
            description: 'Double-walled stainless steel tumbler',
            isCustomizable: true,
            isFeatured: true,
            status: 'active',
            displayOrder: 1
        }
    });

    console.log(`✅ Created ${4} products\n`);

    // 4. Create Product Variants
    console.log('🔧 Creating product variants...');

    // Tote Bag A4 Variants
    const toteBagA4DTF = await prisma.productVariant.create({
        data: {
            productId: toteBagA4.id,
            name: 'A4 Canvas - DTF Print',
            sku: 'TB-A4-DTF-NAT',
            attributes: {
                size: 'A4',
                material: 'Canvas 12oz',
                printing: 'DTF',
                color: 'Natural'
            },
            basePrice: 45000,
            stockStatus: 'in-stock',
            productionTime: '3-5 days',
            weight: 150,
            dimensions: { length: 35, width: 25, height: 2 },
            displayOrder: 1,
            isActive: true
        }
    });

    const toteBagA4DTG = await prisma.productVariant.create({
        data: {
            productId: toteBagA4.id,
            name: 'A4 Canvas - DTG Print',
            sku: 'TB-A4-DTG-NAT',
            attributes: {
                size: 'A4',
                material: 'Canvas 12oz',
                printing: 'DTG',
                color: 'Natural'
            },
            basePrice: 50000,
            stockStatus: 'in-stock',
            productionTime: '3-5 days',
            weight: 150,
            dimensions: { length: 35, width: 25, height: 2 },
            displayOrder: 2,
            isActive: true
        }
    });

    // Tote Bag A3 Variants
    await prisma.productVariant.create({
        data: {
            productId: toteBagA3.id,
            name: 'A3 Canvas - DTF Print',
            sku: 'TB-A3-DTF-NAT',
            attributes: {
                size: 'A3',
                material: 'Canvas 12oz',
                printing: 'DTF',
                color: 'Natural'
            },
            basePrice: 55000,
            stockStatus: 'in-stock',
            productionTime: '3-5 days',
            weight: 200,
            dimensions: { length: 42, width: 30, height: 2 },
            displayOrder: 1,
            isActive: true
        }
    });

    // T-Shirt Variants
    await prisma.productVariant.createMany({
        data: [
            {
                productId: tshirtCotton.id,
                name: 'T-Shirt S - DTF',
                sku: 'TS-COT-S-DTF-WHT',
                attributes: { size: 'S', material: 'Cotton 180gsm', printing: 'DTF', color: 'White' },
                basePrice: 65000,
                stockStatus: 'in-stock',
                productionTime: '3-5 days',
                weight: 180,
                displayOrder: 1,
                isActive: true
            },
            {
                productId: tshirtCotton.id,
                name: 'T-Shirt M - DTF',
                sku: 'TS-COT-M-DTF-WHT',
                attributes: { size: 'M', material: 'Cotton 180gsm', printing: 'DTF', color: 'White' },
                basePrice: 65000,
                stockStatus: 'in-stock',
                productionTime: '3-5 days',
                weight: 200,
                displayOrder: 2,
                isActive: true
            },
            {
                productId: tshirtCotton.id,
                name: 'T-Shirt L - DTF',
                sku: 'TS-COT-L-DTF-WHT',
                attributes: { size: 'L', material: 'Cotton 180gsm', printing: 'DTF', color: 'White' },
                basePrice: 70000,
                stockStatus: 'in-stock',
                productionTime: '3-5 days',
                weight: 220,
                displayOrder: 3,
                isActive: true
            }
        ]
    });

    // Tumbler Variant
    await prisma.productVariant.create({
        data: {
            productId: tumblerSteel.id,
            name: 'Tumbler 500ml - Laser',
            sku: 'TM-SS-500-LSR',
            attributes: {
                capacity: '500ml',
                material: 'Stainless Steel 304',
                printing: 'Laser Engraving',
                color: 'Silver'
            },
            basePrice: 85000,
            stockStatus: 'in-stock',
            productionTime: '5-7 days',
            weight: 350,
            dimensions: { diameter: 8, height: 20 },
            displayOrder: 1,
            isActive: true
        }
    });

    console.log(`✅ Created ${7} product variants\n`);

    // 5. Create Mockup Templates
    console.log('🎭 Creating mockup templates...');

    // Tote Bag A4 Mockup
    await prisma.mockupTemplate.create({
        data: {
            productId: toteBagA4.id,
            variantId: toteBagA4DTF.id,
            canvasWidth: 2000,
            canvasHeight: 2000,
            aspectRatio: '1:1',
            printAreaX: 500,
            printAreaY: 600,
            printAreaWidth: 1000,
            printAreaHeight: 800,
            safeAreaX: 550,
            safeAreaY: 650,
            safeAreaWidth: 900,
            safeAreaHeight: 700,
            hasBackView: false,
            maxColors: 8,
            allowedFormats: ['PNG', 'SVG', 'AI', 'PDF'],
            minResolution: 300,
            maxFileSize: 10,
            isActive: true
        }
    });

    // T-Shirt Mockup
    await prisma.mockupTemplate.create({
        data: {
            productId: tshirtCotton.id,
            variantId: null, // General for all variants
            canvasWidth: 2400,
            canvasHeight: 3000,
            aspectRatio: '4:5',
            printAreaX: 600,
            printAreaY: 800,
            printAreaWidth: 1200,
            printAreaHeight: 1400,
            safeAreaX: 650,
            safeAreaY: 850,
            safeAreaWidth: 1100,
            safeAreaHeight: 1300,
            hasBackView: true,
            backPrintAreaX: 600,
            backPrintAreaY: 800,
            backPrintAreaWidth: 1200,
            backPrintAreaHeight: 1400,
            maxColors: 6,
            allowedFormats: ['PNG', 'SVG', 'AI'],
            minResolution: 300,
            maxFileSize: 15,
            isActive: true
        }
    });

    console.log(`✅ Created ${2} mockup templates\n`);

    // 6. Create Merch Settings
    console.log('⚙️ Creating merch settings...');
    await prisma.merchSettings.upsert({
        where: { brandId: brand.id },
        update: {},
        create: {
            brandId: brand.id,
            heroMode: 'SINGLE',
            heroTitle: 'Custom Merchandise Made Easy',
            heroSubtitle: 'Premium quality products with your unique designs',
            heroTagline: 'From concept to delivery, we handle everything',
            heroCtaLabel: 'Browse Collections',
            heroCtaLink: '/merchandise',
            highlightLine: 'Trusted by 500+ businesses across Indonesia',
            mockupTitle: 'Try Our Live Mockup Builder',
            mockupSubtitle: 'See your design come to life instantly',
            mockupTagline: 'No design skills required',
            mockupEnabled: true
        }
    });
    console.log(`✅ Merch settings created\n`);

    console.log('✨ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Brand: 1`);
    console.log(`   - Collections: 3`);
    console.log(`   - Products: 4`);
    console.log(`   - Variants: 7`);
    console.log(`   - Mockup Templates: 2`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
