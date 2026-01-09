
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Test Data for Mockup Verification...');

    try {
        // 1. Ensure Brand 'merch' exists
        let brand = await prisma.brand.findUnique({ where: { slug: 'merch' } });
        if (!brand) {
            console.log('   Creating Brand "merch"...');
            brand = await prisma.brand.create({
                data: {
                    slug: 'merch',
                    name: 'Achiera Merch',
                    isActive: true
                }
            });
        }

        // 2. Create Template
        const slug = 'test-tumbler-' + Date.now();
        console.log(`   Creating Template "${slug}"...`);
        const template = await prisma.mockupProductTemplate.create({
            data: {
                brandId: brand.id,
                slug: slug,
                displayName: 'Test Tumbler (Verification)',
                productType: 'tumbler',
                hasVariants: true
            }
        });

        // 3. Create Variant
        console.log('   Creating Variant "Test White"...');
        await prisma.mockupVariant.create({
            data: {
                templateId: template.id,
                name: 'Test White',
                baseImageUrl: 'https://via.placeholder.com/600x600.png?text=Tumbler+White',
                safeZoneX: 0.25,
                safeZoneY: 0.3,
                safeZoneWidth: 0.5,
                safeZoneHeight: 0.4,
                isActive: true,
                orderIndex: 0
            }
        });

        console.log('✅ Seed successful! Template ID:', template.id);
        console.log('👉 Please check http://localhost:3000/merchandise (Mockup Builder) to see "Test Tumbler (Verification)".');

        // 4. Verify via Fetch (optional, but good for log)
        // const res = await fetch(`http://localhost:3000/api/public/mockup-templates?brandSlug=merch`);
        // const json = await res.json();
        // console.log('   Public API Result:', json.templates.length, 'templates found.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
