
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = "mahesajulioresman25@achiera.com";
    const password = "Mahesa2005@";
    const name = "Mahesa Julio Resman";

    console.log(`Checking user: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Upsert User (Create or Update)
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            globalRole: 'OWNER', // Force Owner
        },
        create: {
            email,
            name,
            passwordHash: hashedPassword,
            globalRole: 'OWNER',
        }
    });

    console.log(`✅ User ensured: ${user.id} (${user.globalRole})`);

    // 2. Assign Brand Role for 'rasa-ibu'
    // Ensure brand exists first
    let brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });

    // If brand missing, create it (Just in case)
    if (!brand) {
        console.log("Brand 'rasa-ibu' not found. Creating...");
        brand = await prisma.brand.create({
            data: {
                slug: 'rasa-ibu',
                name: 'Rasa Ibu',
            }
        });
    }

    if (brand) {
        console.log(`Assigning OWNER role for Brand: ${brand.name} (${brand.id})`);
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
        console.log("✅ Brand access granted.");
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
