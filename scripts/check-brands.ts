import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Brand Check ---');
    const brands = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true
        }
    });
    console.log(JSON.stringify(brands, null, 2));

    console.log('\n--- Admin Users Check ---');
    const users = await prisma.user.findMany({
        where: { globalRole: 'OWNER' },
        select: { id: true, name: true, email: true }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
