import { PrismaClient, BrandRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userEmail = 'mahesajulioresman@achier.com';

    const brandsToCreate = [
        { name: 'Achiera', slug: 'achiera' },
        { name: 'RASA IBU', slug: 'rasa-ibu' },
        { name: 'Achiera Merch', slug: 'achiera-merch' },
        { name: 'Achiera IT Solution', slug: 'achiera-it-solution' }
    ];

    console.log('--- Starting Brand Hierarchy Setup ---');

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.error(`User ${userEmail} not found! Please create user first.`);
        return;
    }

    // 2. Create/Sync Brands
    for (const b of brandsToCreate) {
        console.log(`Ensuring brand: ${b.name} (${b.slug})...`);
        const brand = await prisma.brand.upsert({
            where: { slug: b.slug },
            update: { name: b.name },
            create: {
                name: b.name,
                slug: b.slug
            }
        });

        // 3. Link User to Brand as BRAND_ADMIN (Owner)
        console.log(`Linking user to ${b.slug}...`);
        await prisma.userBrandRole.upsert({
            where: {
                userId_brandId: {
                    userId: user.id,
                    brandId: brand.id
                }
            },
            update: { role: 'BRAND_ADMIN' },
            create: {
                userId: user.id,
                brandId: brand.id,
                role: 'BRAND_ADMIN'
            }
        });
    }

    console.log('--- Hierarchy Setup Complete ---');
    await prisma.$disconnect();
}

main().catch(console.error);
