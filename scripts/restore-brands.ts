import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreBrands() {
    console.log('🚀 Restoring missing brands...\n');

    const brandsToRestore = [
        {
            name: 'Achiera Merch',
            slug: 'achiera-merch',
        },
        {
            name: 'IT Solution',
            slug: 'achiera-it-solution',
        }
    ];

    try {
        for (const b of brandsToRestore) {
            const existing = await prisma.brand.findUnique({
                where: { slug: b.slug }
            });

            if (!existing) {
                console.log(`📡 Adding brand: ${b.name} (${b.slug})`);
                await prisma.brand.create({
                    data: {
                        name: b.name,
                        slug: b.slug
                    }
                });
            } else {
                console.log(`✅ Brand already exists: ${b.name}`);
            }
        }

        console.log('\n✨ Restore complete!');
    } catch (error) {
        console.error('❌ Error restoring brands:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreBrands();
