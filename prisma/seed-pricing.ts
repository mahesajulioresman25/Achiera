import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('💰 Starting Pricing Logic Seed...');

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
        // cast type to any to avoid TS enum issues
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
    console.log('   🧹 Clearing old Global rules...');
    await prisma.priceRule.deleteMany({ where: { scope: 'GLOBAL' } });

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
        // Plastisol Color Addon
        {
            componentId: componentMap['COLOR_ADDON'],
            scope: 'GLOBAL',
            amount: 5000,
            metadata: { colorCount: 2 },
            priority: 20
        },
        {
            componentId: componentMap['COLOR_ADDON'],
            scope: 'GLOBAL',
            amount: 10000,
            metadata: { colorCount: 3 },
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
            priority: 100
        },
        // Bulk 50+: x0.9
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
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
