import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreBrands() {
    console.log('🚀 Restoring Core Brands (Holding, Food, Merch, IT)...\n');

    const brandsToRestore = [
        { name: 'Achiera Holding', slug: 'achiera' },
        { name: 'Rasa Ibu', slug: 'rasa-ibu' },
        { name: 'Achiera Merch', slug: 'merch' },
        { name: 'Achiera IT Solutions', slug: 'it-solutions' }
    ];

    try {
        // 1. Restore Brands
        const brandIds: string[] = [];
        for (const b of brandsToRestore) {
            const result = await prisma.brand.upsert({
                where: { slug: b.slug },
                update: { name: b.name },
                create: { name: b.name, slug: b.slug, isActive: true }
            });
            brandIds.push(result.id);
            console.log(`✅ Brand: ${b.name} (${b.slug})`);
        }

        // 2. Link User (Mahesa)
        const email = 'mahesajulioresman25@achiera.com';
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            console.log(`\n👥 Linking user ${user.name} (${user.email})...`);

            // Upgrade to OWNER to ensure visibility
            await prisma.user.update({
                where: { id: user.id },
                data: { globalRole: 'OWNER' }
            });

            for (const brandId of brandIds) {
                await prisma.userBrandRole.upsert({
                    where: { userId_brandId: { userId: user.id, brandId } },
                    update: { role: 'BRAND_ADMIN' },
                    create: { userId: user.id, brandId, role: 'BRAND_ADMIN' }
                });
            }
            console.log('✅ User roles and global role (OWNER) updated.');
        } else {
            console.log('\n⚠️ User mahesajulioresman@achier.com not found. Skipping role assignment.');
        }

        console.log('\n✨ Restore complete! Please refresh the dashboard.');
    } catch (error) {
        console.error('❌ Error restoring brands:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreBrands();
