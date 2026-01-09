
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. List all users
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        include: { brandRoles: { include: { brand: true } } }
    });

    if (users.length === 0) {
        console.log("No users found. You need to register first.");
        return;
    }

    console.log("\n--- EXISTING USERS ---");
    users.forEach((u, i) => {
        console.log(`${i + 1}. [${u.globalRole}] ${u.name} (${u.email})`);
        if (u.brandRoles.length > 0) {
            u.brandRoles.forEach(br => console.log(`   - ${br.role} at ${br.brand.name}`));
        } else {
            console.log(`   - No brand roles`);
        }
    });
    console.log("----------------------\n");

    // 2. Ask to promote the first user to OWNER (since this is a restore request)
    // Or just promote the one matching "user@rasaibu.com" or the one just registered.
    // For now, let's hardcode promoting the LAST registered user (likely the one just made) or specific email if passed.

    const targetEmail = process.argv[2]; // Pass email as arg if want specific

    let targetUser = targetEmail
        ? users.find(u => u.email === targetEmail)
        : users[users.length - 1]; // Default to latest

    if (targetUser) {
        console.log(`\nPromoting user: ${targetUser.email} to OWNER...`);

        await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                globalRole: 'OWNER',
                // Also give owner role on "rasa-ibu" brand if exists
            }
        });

        // Find rasa-ibu brand
        const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
        if (brand) {
            await prisma.userBrandRole.upsert({
                where: { userId_brandId: { userId: targetUser.id, brandId: brand.id } },
                create: { userId: targetUser.id, brandId: brand.id, role: 'BRAND_ADMIN' },
                update: { role: 'BRAND_ADMIN' }
            });
            console.log(`Also assigned BRAND_ADMIN role for Brand: ${brand.name}`);
        }

        console.log("✅ Success! User is now OWNER.");
    } else {
        console.log("Target user not found.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
