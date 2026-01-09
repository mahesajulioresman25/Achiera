import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'mahesajulioresman@achiera.com';
    const password = 'mahesa140705';
    const name = 'Mahesa Julio Resman';

    console.log(`Adding user: ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);

    const brand = await prisma.brand.findFirst({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.error('Brand RASA IBU not found!');
        return;
    }

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash,
                name
            },
            create: {
                email,
                name,
                passwordHash,
                globalRole: 'USER',
                brandRoles: {
                    create: {
                        brandId: brand.id,
                        role: 'BRAND_ADMIN'
                    }
                }
            }
        });

        console.log('User created/updated successfully:', user.email);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
