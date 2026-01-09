import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
    console.log('🔍 Checking database state...\n');

    try {
        // 1. Check brands
        const brands = await prisma.brand.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        orders: true,
                        warehouses: true,
                        userRoles: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`📊 Total brands: ${brands.length}\n`);
        brands.forEach(brand => {
            console.log(`Brand: ${brand.name} (${brand.slug})`);
            console.log(`  - Orders: ${brand._count.orders}`);
            console.log(`  - Warehouses: ${brand._count.warehouses}`);
            console.log(`  - User Roles: ${brand._count.userRoles}`);
            console.log('');
        });

        // 2. Check if Rasa Ibu has products
        const rasaIbu = brands.find(b => b.slug === 'rasa-ibu');
        if (rasaIbu) {
            const categories = await prisma.frozenCategory.count({
                where: { brandId: rasaIbu.id }
            });
            const products = await prisma.frozenProduct.count({
                where: { category: { brandId: rasaIbu.id } }
            });
            console.log(`Rasa Ibu Data:`);
            console.log(`  - Categories: ${categories}`);
            console.log(`  - Products: ${products}\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseState();
