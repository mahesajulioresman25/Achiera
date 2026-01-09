// Quick script to check if MockupProductTemplates exist
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            console.log('❌ Brand "merch" not found');
            return;
        }

        console.log('✅ Brand found:', brand.name);

        // Check products
        const products = await prisma.product.findMany({
            where: { collection: { brandId: brand.id } },
            include: {
                _count: {
                    select: { variants: true }
                }
            }
        });

        console.log(`\n📦 Found ${products.length} products:`);
        products.forEach(p => {
            console.log(`  - ${p.name} (${p._count.variants} variants)`);
        });

        if (products.length === 0) {
            console.log('\n⚠️  No products found! You need to create products first.');
            console.log('   Go to: Dashboard → Mockup Builder → New Template');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProducts();
