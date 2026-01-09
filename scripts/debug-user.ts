import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Listing All Users ---');
    const users = await prisma.user.findMany({
        include: {
            brandRoles: {
                include: {
                    brand: true
                }
            }
        }
    });

    users.forEach(user => {
        console.log(`User: ${user.email} (${user.name})`);
        if (user.brandRoles.length === 0) {
            console.log('  - No Brand Roles');
        } else {
            user.brandRoles.forEach(br => {
                console.log(`  - Brand: ${br.brand.name} (Slug: ${br.brand.slug}, Role: ${br.role})`);
            });
        }
    });

    await prisma.$disconnect();
}

debug().catch(console.error);
