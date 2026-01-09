
import { PrismaClient, PriceComponentType, PriceScope } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Pricing Engine...');

    // 1. Create Price Components
    const components = [
        { code: 'BULK_DISCOUNT', name: 'Bulk Discount', type: PriceComponentType.PER_UNIT }, // Negative value
        { code: 'PRINT_DTF', name: 'DTF Printing', type: PriceComponentType.PER_UNIT },
        { code: 'PRINT_PLASTISOL', name: 'Plastisol Printing', type: PriceComponentType.PER_UNIT },
        { code: 'SIZE_SURCHARGE', name: 'Size Surcharge', type: PriceComponentType.PER_UNIT },
        { code: 'SETUP_FEE', name: 'Screen Setup Fee', type: PriceComponentType.FIXED }
    ];

    for (const c of components) {
        await prisma.priceComponent.upsert({
            where: { code: c.code },
            update: {},
            create: c
        });
    }

    console.log('✅ Components created');

    // 2. Fetch Components
    const bulkComp = await prisma.priceComponent.findUnique({ where: { code: 'BULK_DISCOUNT' } });
    const dtfComp = await prisma.priceComponent.findUnique({ where: { code: 'PRINT_DTF' } });
    const plastisolComp = await prisma.priceComponent.findUnique({ where: { code: 'PRINT_PLASTISOL' } });

    // 3. Create Rules (Global for now, or Brand scoped if we knew Brand ID)
    // Assuming 'merch' brand exists, let's try to find it.
    const brand = await prisma.brand.findUnique({ where: { slug: 'merch' } });
    if (!brand) return;

    // RULE: Bulk Discount (Buy 12+, save 5000 per shirt)
    if (bulkComp) {
        await prisma.priceRule.create({
            data: {
                componentId: bulkComp.id,
                scope: PriceScope.BRAND,
                scopeId: brand.id,
                minQty: 12,
                maxQty: 23,
                amount: -5000,
                priority: 10,
                metadata: {}
            }
        });
        await prisma.priceRule.create({
            data: {
                componentId: bulkComp.id,
                scope: PriceScope.BRAND,
                scopeId: brand.id,
                minQty: 24, // 2 Dozen
                amount: -10000,
                priority: 10,
                metadata: {}
            }
        });
    }

    // RULE: DTF Cost (A4 = +15k, A3 = +30k)
    if (dtfComp) {
        await prisma.priceRule.create({
            data: {
                componentId: dtfComp.id,
                scope: PriceScope.BRAND,
                scopeId: brand.id,
                amount: 15000,
                priority: 5,
                metadata: { printMethod: 'dtf', designSize: 'A4' }
            }
        });
        await prisma.priceRule.create({
            data: {
                componentId: dtfComp.id,
                scope: PriceScope.BRAND,
                scopeId: brand.id,
                amount: 30000,
                priority: 5,
                metadata: { printMethod: 'dtf', designSize: 'A3' }
            }
        });
    }

    console.log('✅ Pricing Rules Seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
