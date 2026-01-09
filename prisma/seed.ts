import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Multi-Brand CMS seed...');

    // ============================================
    // 1. CREATE BRANDS
    // ============================================
    console.log('\n📦 Creating Brands...');

    const merchBrand = await prisma.brand.upsert({
        where: { slug: 'merch' },
        update: {},
        create: {
            slug: 'merch',
            name: 'ACHIERA Merch',
            isActive: true,
        },
    });
    console.log('✅ Brand created: ACHIERA Merch');

    const itBrand = await prisma.brand.upsert({
        where: { slug: 'it-solutions' },
        update: {},
        create: {
            slug: 'it-solutions',
            name: 'ACHIERA IT Solutions',
            isActive: true,
        },
    });
    console.log('✅ Brand created: ACHIERA IT Solutions');

    // ============================================
    // 2. CREATE USERS
    // ============================================
    console.log('\n👥 Creating Users...');

    const superAdmin = await prisma.user.upsert({
        where: { email: 'super@achiera.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'super@achiera.com',
            passwordHash: await bcrypt.hash('achieraSuper123', 10),
            globalRole: 'OWNER',
        },
    });
    console.log('✅ User created: Super Admin');

    const merchAdmin = await prisma.user.upsert({
        where: { email: 'merch@achiera.com' },
        update: {},
        create: {
            name: 'Merch Admin',
            email: 'merch@achiera.com',
            passwordHash: await bcrypt.hash('achieraMerch123', 10),
        },
    });
    console.log('✅ User created: Merch Admin');

    const itAdmin = await prisma.user.upsert({
        where: { email: 'it@achiera.com' },
        update: {},
        create: {
            name: 'IT Admin',
            email: 'it@achiera.com',
            passwordHash: await bcrypt.hash('achieraIT123', 10),
        },
    });
    console.log('✅ User created: IT Admin');

    // ============================================
    // 3. CREATE USER BRAND ROLES
    // ============================================
    console.log('\n🔐 Assigning Brand Roles...');

    // Super Admin → All brands
    await prisma.userBrandRole.upsert({
        where: {
            userId_brandId: {
                userId: superAdmin.id,
                brandId: merchBrand.id,
            },
        },
        update: {},
        create: {
            userId: superAdmin.id,
            brandId: merchBrand.id,
            role: 'BRAND_ADMIN',
        },
    });

    await prisma.userBrandRole.upsert({
        where: {
            userId_brandId: {
                userId: superAdmin.id,
                brandId: itBrand.id,
            },
        },
        update: {},
        create: {
            userId: superAdmin.id,
            brandId: itBrand.id,
            role: 'BRAND_ADMIN',
        },
    });
    console.log('✅ Super Admin → All brands');

    // Merch Admin → Merch only
    await prisma.userBrandRole.upsert({
        where: {
            userId_brandId: {
                userId: merchAdmin.id,
                brandId: merchBrand.id,
            },
        },
        update: {},
        create: {
            userId: merchAdmin.id,
            brandId: merchBrand.id,
            role: 'BRAND_ADMIN',
        },
    });
    console.log('✅ Merch Admin → Merch brand');

    // IT Admin → IT only
    await prisma.userBrandRole.upsert({
        where: {
            userId_brandId: {
                userId: itAdmin.id,
                brandId: itBrand.id,
            },
        },
        update: {},
        create: {
            userId: itAdmin.id,
            brandId: itBrand.id,
            role: 'BRAND_ADMIN',
        },
    });
    console.log('✅ IT Admin → IT Solutions brand');

    // ============================================
    // 4. CREATE MERCH SETTINGS
    // ============================================
    console.log('\n⚙️  Creating Merch Settings...');

    await prisma.merchSettings.upsert({
        where: { brandId: merchBrand.id },
        update: {},
        create: {
            brandId: merchBrand.id,
            heroMode: 'SINGLE',
            heroTitle: 'Modern Brands Deserve Thoughtful Merchandise',
            heroSubtitle: 'ACHIERA Merchandise helps companies create lasting impressions with high-quality, functional products crafted to reflect your brand identity—whether for onboarding, events, or client gifting.',
            heroTagline: 'Designed for teams. Crafted for brands.',
            heroCtaLabel: 'Request Catalogue',
            heroCtaLink: '/contact',
            highlightLine: 'Premium quality meets thoughtful design',
            mockupTitle: 'Try Live Mockup — See Your Brand Come to Life',
            mockupSubtitle: 'Upload your logo and instantly preview how it looks on our premium merchandise—before you place an order.',
            mockupTagline: 'Fast, accurate, and completely free to try.',
            mockupEnabled: true,
        },
    });
    console.log('✅ Merch Settings created');

    // ============================================
    // 5. CREATE MERCH COLLECTIONS
    // ============================================
    console.log('\n📚 Creating Merch Collections...');

    const collections = [
        {
            brandId: merchBrand.id,
            slug: 'apparel',
            name: 'Apparel Collection',
            heroTitle: 'Premium Custom Apparel',
            heroSubtitle: 'High-quality clothing that represents your brand with style and comfort.',
            highlights: JSON.stringify([
                'Premium cotton and blended fabrics',
                'Screen printing, embroidery, and DTG options',
                'Sizes from XS to 3XL',
                'Eco-friendly material options available',
            ]),
            whatsInside: JSON.stringify([
                'T-Shirts (various styles)',
                'Hoodies & Sweatshirts',
                'Polo Shirts',
                'Jackets',
            ]),
            designOptions: JSON.stringify([
                'Screen Printing',
                'Embroidery',
                'Direct-to-Garment (DTG)',
                'Heat Transfer',
            ]),
            materialPoints: JSON.stringify([
                'Premium 100% cotton',
                'Breathable poly-cotton blends',
                'Pre-shrunk fabrics',
                'Colorfast dyes',
            ]),
            useCases: JSON.stringify([
                { title: 'Employee Uniforms', description: 'Professional branded apparel for your team' },
                { title: 'Event Merchandise', description: 'Custom t-shirts and hoodies for conferences' },
                { title: 'Brand Merchandise', description: 'Sell or gift branded clothing to customers' },
            ]),
            packagingOptions: JSON.stringify([
                'Individual polybags',
                'Branded boxes',
                'Eco-friendly packaging',
            ]),
            faq: JSON.stringify([
                { question: 'What is the minimum order?', answer: 'MOQ is typically 50-100 pieces depending on the item.' },
                { question: 'Can we mix sizes?', answer: 'Yes, you can mix sizes within the same design.' },
                { question: 'How long is production?', answer: 'Standard turnaround is 10-14 business days.' },
            ]),
            galleryImages: JSON.stringify([
                '/images/apparel/look1.jpg',
                '/images/apparel/look2.jpg',
                '/images/apparel/look3.jpg',
            ]),
        },
        {
            brandId: merchBrand.id,
            slug: 'drinkware',
            name: 'Drinkware Collection',
            heroTitle: 'Premium Drinkware',
            heroSubtitle: 'Tumblers and bottles designed for everyday use, built to carry your brand wherever they go.',
            highlights: JSON.stringify([
                'Premium stainless steel',
                'Double-wall insulation',
                'Leak-proof lids',
                'BPA-free materials',
            ]),
            whatsInside: JSON.stringify([
                'Stainless Steel Tumblers',
                'Water Bottles',
                'Coffee Mugs',
                'Travel Flasks',
            ]),
            designOptions: JSON.stringify([
                'Laser Engraving',
                'UV Printing',
                'Screen Printing',
                'Vinyl Decals',
            ]),
            materialPoints: JSON.stringify([
                '304 stainless steel',
                'Vacuum insulation',
                'Powder-coated finish',
                'Food-grade materials',
            ]),
            useCases: JSON.stringify([
                { title: 'Corporate Gifts', description: 'Premium drinkware for clients and partners' },
                { title: 'Employee Wellness', description: 'Encourage hydration with branded bottles' },
                { title: 'Event Giveaways', description: 'Practical gifts that attendees will use' },
            ]),
            packagingOptions: JSON.stringify([
                'Individual gift boxes',
                'Kraft boxes',
                'Custom printed boxes',
            ]),
            faq: JSON.stringify([
                { question: 'Are these dishwasher safe?', answer: 'Hand washing is recommended to preserve the branding.' },
                { question: 'How long do they keep drinks cold?', answer: 'Up to 24 hours for cold, 12 hours for hot.' },
                { question: 'Can we print full color?', answer: 'Yes, UV printing allows full-color designs.' },
            ]),
            galleryImages: JSON.stringify([
                '/images/drinkware/tumbler1.jpg',
                '/images/drinkware/bottle1.jpg',
                '/images/drinkware/mug1.jpg',
            ]),
        },
        {
            brandId: merchBrand.id,
            slug: 'office-kits',
            name: 'Office & Stationery Kits',
            heroTitle: 'Premium Office Essentials',
            heroSubtitle: 'Elevate your workspace with premium stationery and office essentials.',
            highlights: JSON.stringify([
                'Premium paper stock',
                'Soft-touch finishes',
                'Curated sets',
                'Custom branding options',
            ]),
            whatsInside: JSON.stringify([
                'Hardcover Notebooks',
                'Premium Pens',
                'Desk Organizers',
                'Sticky Notes',
            ]),
            designOptions: JSON.stringify([
                'Blind Debossing',
                'Foil Stamping',
                'UV Printing',
                'Custom Belly Bands',
            ]),
            materialPoints: JSON.stringify([
                'Acid-free paper',
                'Durable binding',
                'PU leather covers',
                'Aluminum pen bodies',
            ]),
            useCases: JSON.stringify([
                { title: 'New Hire Kits', description: 'Welcome packages for new employees' },
                { title: 'Conference Materials', description: 'Professional stationery for events' },
                { title: 'Executive Gifts', description: 'Premium sets for VIP clients' },
            ]),
            packagingOptions: JSON.stringify([
                'Custom gift boxes',
                'Branded sleeves',
                'Eco-friendly packaging',
            ]),
            faq: JSON.stringify([
                { question: 'Can we customize the contents?', answer: 'Yes, you can mix and match items to create custom kits.' },
                { question: 'Do you offer eco-friendly options?', answer: 'Yes, we have recycled and bamboo options.' },
                { question: 'What is the MOQ for notebooks?', answer: 'MOQ is typically 100 units for custom notebooks.' },
            ]),
            galleryImages: JSON.stringify([
                '/images/office-kits/notebook1.jpg',
                '/images/office-kits/pen1.jpg',
                '/images/office-kits/kit1.jpg',
            ]),
        },
    ];

    for (const collection of collections) {
        await prisma.merchCollection.create({ data: collection });
        console.log(`✅ Collection created: ${collection.name}`);
    }

    // ============================================
    // 6. CREATE MOCKUP CONFIGS
    // ============================================
    console.log('\n🎨 Creating Mockup Configs... (SKIPPED - Model missing)');

    /* 
    const mockupConfigs = [
        {
            brandId: merchBrand.id,
            productType: 'tote',
            displayName: 'Tote Bag',
            baseImages: JSON.stringify({
                white: '/mockups/tote-white.png',
                cream: '/mockups/tote-cream.png',
                black: '/mockups/tote-black.png',
                navy: '/mockups/tote-navy.png',
                olive: '/mockups/tote-olive.png',
            }),
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            productType: 'tshirt',
            displayName: 'T-Shirt',
            baseImages: JSON.stringify({
                white: '/mockups/tshirt-white.png',
                cream: '/mockups/tshirt-cream.png',
                black: '/mockups/tshirt-black.png',
                navy: '/mockups/tshirt-navy.png',
                olive: '/mockups/tshirt-olive.png',
            }),
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            productType: 'hoodie',
            displayName: 'Hoodie',
            baseImages: JSON.stringify({
                white: '/mockups/hoodie-white.png',
                cream: '/mockups/hoodie-cream.png',
                black: '/mockups/hoodie-black.png',
                navy: '/mockups/hoodie-navy.png',
                olive: '/mockups/hoodie-olive.png',
            }),
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            productType: 'tumbler',
            displayName: 'Tumbler',
            baseImages: JSON.stringify({
                white: '/mockups/tumbler-white.png',
                cream: '/mockups/tumbler-cream.png',
                black: '/mockups/tumbler-black.png',
                navy: '/mockups/tumbler-navy.png',
                olive: '/mockups/tumbler-olive.png',
            }),
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            productType: 'bag',
            displayName: 'Backpack',
            baseImages: JSON.stringify({
                white: '/mockups/bag-white.png',
                cream: '/mockups/bag-cream.png',
                black: '/mockups/bag-black.png',
                navy: '/mockups/bag-navy.png',
                olive: '/mockups/bag-olive.png',
            }),
            isActive: true,
        },
    ];

    for (const config of mockupConfigs) {
        await prisma.mockupConfig.create({ data: config });
        console.log(`✅ Mockup config created: ${config.displayName}`);
    }
    */

    // ============================================
    // 6.5. CREATE PRICING RULES
    // ============================================
    console.log('\n💰 Creating Pricing Components & Rules...');

    // 1. Components
    const priceComponents = [
        { code: 'PRINT_DTF', name: 'DTF Printing', type: 'PER_UNIT', description: 'Direct to Film printing technology' },
        { code: 'PRINT_PLASTISOL', name: 'Plastisol Printing', type: 'PER_UNIT', description: 'Traditional screen printing' },
        { code: 'COLOR_ADDON', name: 'Extra Color', type: 'PER_UNIT', description: 'Cost per additional color (Plastisol)' },
        { code: 'SIZE_A3', name: 'Large Print (A3)', type: 'MULTIPLIER', description: 'Upcharge for A3 size vs A4' },
        { code: 'BULK_TIER_12', name: 'Bulk Discount (12+)', type: 'MULTIPLIER', description: 'Discount for orders over 1 dozen' },
        { code: 'BULK_TIER_50', name: 'Bulk Discount (50+)', type: 'MULTIPLIER', description: 'Discount for orders over 50 pcs' },
    ];

    const componentMap: Record<string, string> = {};

    for (const pc of priceComponents) {
        // cast type to any to avoid TS enum issues in seed script if not imported
        const comp = await prisma.priceComponent.upsert({
            where: { code: pc.code },
            update: {},
            create: {
                code: pc.code,
                name: pc.name,
                type: pc.type as any,
                description: pc.description
            }
        });
        componentMap[pc.code] = comp.id;
        console.log(`   🔸 Component: ${pc.name}`);
    }

    // 2. Rules
    // We clear existing rules to avoid duplicates if re-running
    // await prisma.priceRule.deleteMany(); // Optional, but safer for dev

    const rules = [
        // DTF Base Cost: +15,000
        {
            componentId: componentMap['PRINT_DTF'],
            scope: 'GLOBAL',
            amount: 15000,
            metadata: { printMethod: 'dtf' },
            priority: 10
        },
        // Plastisol Base Cost: +10,000
        {
            componentId: componentMap['PRINT_PLASTISOL'],
            scope: 'GLOBAL',
            amount: 10000,
            metadata: { printMethod: 'plastisol' },
            priority: 10
        },
        // Plastisol Color Addon: +5,000 per color (Logic in calculation needs to multiply? Or we add Multiple rules?
        // Actually PriceCalculator logic for PER_UNIT adds ONCE. 
        // For "Per Color", we might need a custom logic or "PER_UNIT" with logic in backend.
        // Let's assume for now 1 color is free/included, extras are +5000.
        // Simpler: Just +5000 if 'colorCount > 1'. The calculator match logic is exact match currently.
        // We will need to update Calculator to handle ">" logic or just exact.
        // For prototype, let's just say "2 Colors" -> +5000.
        {
            componentId: componentMap['COLOR_ADDON'],
            scope: 'GLOBAL',
            amount: 5000,
            metadata: { colorCount: 2 }, // Apply this rule if colorCount == 2
            priority: 20
        },
        {
            componentId: componentMap['COLOR_ADDON'],
            scope: 'GLOBAL',
            amount: 10000,
            metadata: { colorCount: 3 }, // Apply this rule if colorCount == 3
            priority: 20
        },
        // A3 Size: x1.2
        {
            componentId: componentMap['SIZE_A3'],
            scope: 'GLOBAL',
            amount: 1.2,
            metadata: { designSize: 'A3' },
            priority: 50
        },
        // Bulk 12+: x0.9
        {
            componentId: componentMap['BULK_TIER_12'],
            scope: 'GLOBAL',
            amount: 0.9,
            minQty: 12,
            priority: 100 // Multipliers usually last
        },
        // Bulk 50+: x0.8
        {
            componentId: componentMap['BULK_TIER_50'],
            scope: 'GLOBAL',
            amount: 0.8,
            minQty: 50,
            priority: 101
        }
    ];

    for (const rule of rules) {
        await prisma.priceRule.create({
            data: {
                componentId: rule.componentId,
                scope: rule.scope as any,
                amount: rule.amount,
                metadata: rule.metadata || {},
                minQty: rule.minQty,
                priority: rule.priority
            }
        });
    }
    console.log(`✅ Created ${rules.length} Price Rules`);

    // ============================================
    // 7. CREATE HERO SLIDES (MERCH)
    // ============================================
    console.log('\n🖼️  Creating Hero Slides for Merch...');

    const merchHeroSlides = [
        {
            brandId: merchBrand.id,
            title: 'Modern Brands Deserve Thoughtful Merchandise',
            subtitle: 'High-quality, functional products crafted to reflect your brand identity',
            ctaLabel: 'Request Catalogue',
            ctaLink: '/contact',
            mediaType: 'IMAGE' as const,
            imageUrl: '/images/hero/merch-slide-1.jpg',
            sortOrder: 1,
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            title: 'Elevate Your Brand Experience',
            subtitle: 'From onboarding kits to event merchandise, we craft products that leave lasting impressions',
            ctaLabel: 'Explore Collections',
            ctaLink: '/merchandise/collections',
            mediaType: 'IMAGE' as const,
            imageUrl: '/images/hero/merch-slide-2.jpg',
            sortOrder: 2,
            isActive: true,
        },
    ];

    for (const slide of merchHeroSlides) {
        await prisma.heroSlide.create({ data: slide });
    }
    console.log('✅ Hero slides created for Merch');

    // ============================================
    // 8. CREATE IT SETTINGS
    // ============================================
    console.log('\n⚙️  Creating IT Solutions Settings...');

    await prisma.itSettings.upsert({
        where: { brandId: itBrand.id },
        update: {},
        create: {
            brandId: itBrand.id,
            heroMode: 'SINGLE',
            heroTitle: 'Enterprise IT Solutions That Scale',
            heroSubtitle: 'From custom software development to cloud infrastructure, we build technology solutions that drive business growth.',
            heroTagline: 'Innovation meets reliability',
            heroCtaLabel: 'Start Your Project',
            heroCtaLink: '/contact',
            aboutTitle: 'About ACHIERA IT Solutions',
            aboutContent: 'We are a team of experienced engineers and consultants specializing in enterprise software development, cloud infrastructure, and digital transformation.',
        },
    });
    console.log('✅ IT Settings created');

    // ============================================
    // 9. CREATE HERO SLIDES (IT)
    // ============================================
    console.log('\n🖼️  Creating Hero Slides for IT Solutions...');

    const itHeroSlides = [
        {
            brandId: itBrand.id,
            title: 'Enterprise IT Solutions That Scale',
            subtitle: 'Custom software development, cloud infrastructure, and digital transformation',
            ctaLabel: 'Start Your Project',
            ctaLink: '/contact',
            mediaType: 'IMAGE' as const,
            imageUrl: '/images/hero/it-slide-1.jpg',
            sortOrder: 1,
            isActive: true,
        },
        {
            brandId: itBrand.id,
            title: 'Transform Your Business with Technology',
            subtitle: 'Innovative solutions powered by experienced engineers',
            ctaLabel: 'View Case Studies',
            ctaLink: '/it-solutions/case-studies',
            mediaType: 'IMAGE' as const,
            imageUrl: '/images/hero/it-slide-2.jpg',
            sortOrder: 2,
            isActive: true,
        },
    ];

    for (const slide of itHeroSlides) {
        await prisma.heroSlide.create({ data: slide });
    }
    console.log('✅ Hero slides created for IT Solutions');

    // ============================================
    // 10. CREATE SAMPLE ANALYTICS EVENTS
    // ============================================
    console.log('\n📊 Creating Sample Analytics Events...');

    const now = new Date();
    const analyticsEvents = [
        {
            brandId: merchBrand.id,
            type: 'PAGE_VIEW' as const,
            path: '/merchandise',
            createdAt: new Date(now.getTime() - 86400000 * 7), // 7 days ago
        },
        {
            brandId: merchBrand.id,
            type: 'COLLECTION_CLICK' as const,
            path: '/merchandise/collections/apparel',
            collectionSlug: 'apparel',
            createdAt: new Date(now.getTime() - 86400000 * 5),
        },
        {
            brandId: merchBrand.id,
            type: 'MOCKUP_OPEN' as const,
            path: '/merchandise',
            createdAt: new Date(now.getTime() - 86400000 * 3),
        },
        {
            brandId: itBrand.id,
            type: 'PAGE_VIEW' as const,
            path: '/it-solutions',
            createdAt: new Date(now.getTime() - 86400000 * 6),
        },
    ];

    for (const event of analyticsEvents) {
        await prisma.analyticsEvent.create({ data: event });
    }
    console.log('✅ Sample analytics events created');

    console.log('\n🎉 Multi-Brand CMS seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Super Admin: super@achiera.com / achieraSuper123');
    console.log('   Merch Admin: merch@achiera.com / achieraMerch123');
    console.log('   IT Admin: it@achiera.com / achieraIT123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
