
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const email = "mahesajulioresman25@achiera.com";
    const password = "Mahesa2005@";
    const name = "Mahesa Julio Resman";

    console.log(`Checking user: ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Get Brand ID (Raw or Client - Client read is safe)
        // If client doesn't know 'slug', we query raw.
        let brandId: string;
        try {
            const brands: any[] = await prisma.$queryRaw`SELECT id FROM brands WHERE slug = 'rasa-ibu' LIMIT 1`;
            if (brands.length > 0) {
                brandId = brands[0].id;
                console.log("Found Brand ID:", brandId);
            } else {
                console.log("Brand not found. Creating...");
                brandId = randomUUID(); // Use UUID as fallback ID
                await prisma.$executeRawUnsafe(`
                    INSERT INTO brands (id, slug, name, isActive, createdAt, updatedAt)
                    VALUES ('${brandId}', 'rasa-ibu', 'Rasa Ibu', 1, NOW(), NOW())
                 `);
                console.log("Created Brand ID:", brandId);
            }
        } catch (e) {
            console.error("Failed to query brands:", e);
            return;
        }

        // 2. Upsert User (Raw)
        // Check if user exists to get ID
        let userId: string;
        const users: any[] = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

        if (users.length > 0) {
            userId = users[0].id;
            console.log("User exists. Updating Role...", userId);
            await prisma.$executeRawUnsafe(`
                UPDATE users 
                SET globalRole = 'OWNER', passwordHash = '${hashedPassword}', updatedAt = NOW()
                WHERE id = '${userId}'
            `);
        } else {
            console.log("Creating new User...");
            userId = randomUUID();
            await prisma.$executeRawUnsafe(`
                INSERT INTO users (id, email, name, passwordHash, globalRole, createdAt, updatedAt)
                VALUES ('${userId}', '${email}', '${name}', '${hashedPassword}', 'OWNER', NOW(), NOW())
            `);
        }
        console.log(`✅ User ensured: ${userId}`);

        // 3. Upsert Brand Role (Raw)
        // Table: user_brand_roles (id, userId, brandId, role)
        // Check existence
        const roles: any[] = await prisma.$queryRaw`
            SELECT id FROM user_brand_roles WHERE userId = ${userId} AND brandId = ${brandId} LIMIT 1
        `;

        if (roles.length > 0) {
            console.log("Updating Brand Role to OWNER...");
            await prisma.$executeRawUnsafe(`
                UPDATE user_brand_roles SET role = 'OWNER' WHERE id = '${roles[0].id}'
            `);
        } else {
            console.log("Creating Brand Role OWNER...");
            const roleId = randomUUID();
            await prisma.$executeRawUnsafe(`
                INSERT INTO user_brand_roles (id, userId, brandId, role, createdAt)
                VALUES ('${roleId}', '${userId}', '${brandId}', 'OWNER', NOW())
            `);
        }

        console.log("✅ ACCESS RESTORED SUCCESSFULLY!");

    } catch (e: any) {
        console.error("❌ ERROR FAILED:");
        console.error(e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
