
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brandId = 'test_brand_001';

    console.log(`Checking if brand ${brandId} exists...`);

    let brand = await prisma.brand.findUnique({
        where: { id: brandId }
    });

    if (!brand) {
        console.log(`Brand ${brandId} not found. Creating...`);
        // Need a unique slug
        brand = await prisma.brand.create({
            data: {
                id: brandId,
                slug: 'test-brand-001',
                name: 'Test Brand 001',
                isActive: true,
            }
        });
        console.log(`Brand created: ${brand.id}`);
    } else {
        console.log(`Brand found: ${brand.id}`);
    }

    // Create a dummy decision rule
    const ruleId = 'TEST_RULE_001';
    let rule = await prisma.decisionRule.findUnique({
        where: { brandId_ruleId: { brandId, ruleId } }
    });

    if (!rule) {
        console.log(`Creating dummy rule ${ruleId}...`);
        rule = await prisma.decisionRule.create({
            data: {
                brandId,
                ruleId,
                name: 'Test Rule',
                description: 'A test rule for verification',
                category: 'TEST',
                autonomyLevel: 1,
                status: 'OK',
                isActive: true,
                condition: { foo: 'bar' },
                explanationTemplate: 'Test explanation',
            }
        });
        console.log(`Rule created: ${rule.id}`);
    } else {
        console.log(`Rule found: ${rule.id}`);
    }

    // Create BrandConfig and BudgetPolicy
    console.log(`Seeding BrandConfig and BudgetPolicy for ${brandId}...`);
    await prisma.brandConfig.upsert({
        where: { brandId },
        update: {},
        create: {
            brandId,
            level1Enabled: true,
            level2Enabled: true,
            level3Enabled: false,
            emergencyPaused: false
        }
    });

    await prisma.budgetPolicy.upsert({
        where: { brandId },
        update: {},
        create: {
            brandId,
            dailyExecutionLimit: 10,
            dailyFinancialCap: 5000000,
            weeklyExecutionLimit: 50,
            weeklyFinancialCap: 20000000
        }
    });

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
