import { PrismaClient } from '@prisma/client';
import { ComplianceService } from '../src/lib/services/ComplianceService';

const prisma = new PrismaClient();
const complianceService = new ComplianceService();

async function main() {
    console.log('🔧 Initializing Default Compliance Rules...\n');

    // Get all brands
    const brands = await prisma.brand.findMany({
        where: { isActive: true }
    });

    console.log(`📊 Found ${brands.length} active brands:\n`);
    brands.forEach(brand => {
        console.log(`  - ${brand.name} (${brand.slug})`);
    });

    console.log('\n🚀 Creating default rules for each brand...\n');

    for (const brand of brands) {
        console.log(`\n📝 Initializing rules for: ${brand.name}`);

        try {
            const rules = await complianceService.initializeDefaultRules(brand.id);
            console.log(`   ✅ Created ${rules.length} compliance rules`);

            rules.forEach(rule => {
                console.log(`      - ${rule.name} (${rule.severity})`);
            });
        } catch (error) {
            console.error(`   ❌ Error for ${brand.name}:`, error);
        }
    }

    // Also create global rules (brandId = null)
    console.log('\n\n🌍 Creating global compliance rules...');
    try {
        const globalRules = await complianceService.initializeDefaultRules();
        console.log(`   ✅ Created ${globalRules.length} global rules`);

        globalRules.forEach(rule => {
            console.log(`      - ${rule.name} (${rule.severity})`);
        });
    } catch (error) {
        console.error('   ❌ Error creating global rules:', error);
    }

    // Summary
    const totalRules = await prisma.complianceRule.count();
    console.log(`\n\n✨ Initialization Complete!`);
    console.log(`📊 Total compliance rules in database: ${totalRules}`);
}

main()
    .catch((e) => {
        console.error('❌ Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
