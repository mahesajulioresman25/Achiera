
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = "mahesajulioresman25@achiera.com";
    const password = "Mahesa2005@";
    const name = "Mahesa Julio Resman";

    console.log(`Checking user: ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed.");

        // 1. Upsert User
        console.log("Upserting user...");
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                globalRole: 'OWNER',
            },
            create: {
                email,
                name,
                passwordHash: hashedPassword,
                globalRole: 'OWNER',
            }
        });

        console.log(`✅ User ensured: ${user.id} (${user.globalRole})`);

        // 2. Find Brand
        console.log("Finding brand 'rasa-ibu'...");
        let brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });

        if (!brand) {
            console.log("Brand 'rasa-ibu' not found. Creating...");
            brand = await prisma.brand.create({
                data: {
                    slug: 'rasa-ibu',
                    name: 'Rasa Ibu',
                }
            });
            console.log(`Brand created: ${brand.id}`);
        } else {
            console.log(`Brand found: ${brand.id}`);
        }

        // 3. Assign Role (Try delete then create to avoid upsert issues if any)
        console.log("Assigning Brand Role...");

        // Check existing
        const existingRole = await prisma.userBrandRole.findUnique({
            where: {
                userId_brandId: {
                    userId: user.id,
                    brandId: brand.id
                }
            }
        });

        if (existingRole) {
            console.log("Role exists. Updating to OWNER...");
            await prisma.userBrandRole.update({
                where: { id: existingRole.id },
                data: { role: 'OWNER' }
            });
        } else {
            console.log("Creating new OWNER role...");
            await prisma.userBrandRole.create({
                data: {
                    userId: user.id,
                    brandId: brand.id,
                    role: 'OWNER'
                }
            });
        }

        console.log("✅ Brand access granted.");

    } catch (e: any) {
        console.error("❌ ERROR FAILED:");
        console.error(e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
