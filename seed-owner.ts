// Seed Owner User Script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedOwner() {
    const email = 'mahesajulioresman25@achiera.com';
    const password = 'Mahesa2005@';

    console.log(`🌱 Seeding owner user: ${email}...\n`);

    try {
        // 1. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('✅ User already exists. Updating role to OWNER...');
            await prisma.user.update({
                where: { email },
                data: {
                    globalRole: 'OWNER',
                    passwordHash: passwordHash // Update password too just in case
                }
            });
        } else {
            // 3. Create the user
            const user = await prisma.user.create({
                data: {
                    name: 'Mahesa Julio Resman',
                    email: email,
                    passwordHash: passwordHash,
                    globalRole: 'OWNER',
                    emailVerified: true
                }
            });
            console.log('✅ Owner account created successfully!');
            console.log(`   ID: ${user.id}`);
        }

        // 4. Link user to "Rasa Ibu" brand if it exists
        const rasaIbu = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' }
        });

        if (rasaIbu) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.userBrandRole.upsert({
                    where: {
                        userId_brandId: {
                            userId: user.id,
                            brandId: rasaIbu.id
                        }
                    },
                    update: { role: 'BRAND_ADMIN' },
                    create: {
                        userId: user.id,
                        brandId: rasaIbu.id,
                        role: 'BRAND_ADMIN'
                    }
                });
                console.log('✅ Linked user to "Rasa Ibu" brand as BRAND_ADMIN.');
            }
        }

        console.log('\n🎉 Setup complete! You can now log in with:');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);

    } catch (error) {
        console.error('❌ Error seeding owner:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedOwner();
