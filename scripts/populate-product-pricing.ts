import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to populate pricing rules for existing products
 * Run with: npx ts-node scripts/populate-product-pricing.ts
 */

async function populatePricing() {
    console.log('🔧 Populating pricing rules for existing products...\n');

    try {
        // 1. Get all active variants
        const variants = await prisma.mockupVariant.findMany({
            where: { isActive: true },
            include: {
                template: {
                    include: {
                        brand: true
                    }
                }
            }
        });

        console.log(`📦 Found ${variants.length} active variants\n`);

        // 2. Get pricing components
        const baseUnitComponent = await prisma.priceComponent.findUnique({
            where: { code: 'BASE_UNIT' }
        });

        if (!baseUnitComponent) {
            console.error('❌ BASE_UNIT component not found. Run seed-pricing.ts first!');
            return;
        }

        // 3. Create PRODUCT-level rules for each product template
        const templates = await prisma.mockupProductTemplate.findMany({
            where: { hasVariants: true },
            include: {
                variants: {
                    where: { isActive: true },
                    orderBy: { price: 'asc' }
                }
            }
        });

        console.log(`📋 Processing ${templates.length} product templates...\n`);

        for (const template of templates) {
            if (template.variants.length === 0) continue;

            // Use the lowest variant price as the product base price
            const lowestPrice = template.variants[0].price;

            // Check if rule already exists
            const existingRule = await prisma.priceRule.findFirst({
                where: {
                    componentId: baseUnitComponent.id,
                    scope: 'PRODUCT',
                    scopeId: template.id
                }
            });

            if (existingRule) {
                console.log(`⏭️  Skipping ${template.displayName} - rule already exists`);
                continue;
            }

            // Create PRODUCT-level base price rule
            await prisma.priceRule.create({
                data: {
                    componentId: baseUnitComponent.id,
                    scope: 'PRODUCT',
                    scopeId: template.id,
                    priority: 50, // Higher than GLOBAL (0) but lower than VARIANT (100)
                    currency: 'IDR',
                    amount: lowestPrice,
                    isActive: true
                }
            });

            console.log(`✅ Created product rule for: ${template.displayName} (Rp ${Number(lowestPrice).toLocaleString()})`);

            // 4. Create VARIANT-level rules for variants with different prices
            for (const variant of template.variants) {
                if (Number(variant.price) === Number(lowestPrice)) {
                    continue; // Skip if same as product base price
                }

                const existingVariantRule = await prisma.priceRule.findFirst({
                    where: {
                        componentId: baseUnitComponent.id,
                        scope: 'VARIANT',
                        scopeId: variant.id
                    }
                });

                if (existingVariantRule) continue;

                await prisma.priceRule.create({
                    data: {
                        componentId: baseUnitComponent.id,
                        scope: 'VARIANT',
                        scopeId: variant.id,
                        priority: 100, // Highest priority
                        currency: 'IDR',
                        amount: variant.price,
                        isActive: true
                    }
                });

                console.log(`  ↳ Variant override: ${variant.name} (Rp ${Number(variant.price).toLocaleString()})`);
            }
        }

        console.log('\n✨ Pricing population complete!');
        console.log('\n📊 Summary:');

        const totalRules = await prisma.priceRule.count();
        const productRules = await prisma.priceRule.count({ where: { scope: 'PRODUCT' } });
        const variantRules = await prisma.priceRule.count({ where: { scope: 'VARIANT' } });

        console.log(`  - Total rules: ${totalRules}`);
        console.log(`  - Product rules: ${productRules}`);
        console.log(`  - Variant rules: ${variantRules}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

populatePricing();
