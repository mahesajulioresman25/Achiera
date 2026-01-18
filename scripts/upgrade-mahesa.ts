import { PrismaClient, GlobalRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { email: 'mahesajulioresman25@gmail.com' },
        data: { globalRole: 'OWNER' }
    });

    // Also give them BRAND_ADMIN for Rasa Ibu just in case
    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (brand) {
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

    console.log(`Upgraded user ${user.email} to OWNER`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
