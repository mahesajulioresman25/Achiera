const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function restoreOwnerAccount() {
    try {
        const email = 'mahesajulioresman@achiera.com';
        const password = 'Mahesa2005@';
        const name = 'Mahesa Julio Resman';

        console.log('🔄 Restoring owner account...');

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    name,
                    passwordHash,
                    emailVerified: true,
                    globalRole: 'OWNER'
                }
            });
            console.log('✅ Owner account updated successfully!');
            console.log('📧 Email:', updatedUser.email);
            console.log('👤 Name:', updatedUser.name);
            console.log('🔑 Role:', updatedUser.globalRole);
        } else {
            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    emailVerified: true,
                    globalRole: 'OWNER'
                }
            });
            console.log('✅ Owner account created successfully!');
            console.log('📧 Email:', newUser.email);
            console.log('👤 Name:', newUser.name);
            console.log('🔑 Role:', newUser.globalRole);
        }

        console.log('\n🎉 You can now login with:');
        console.log('   Email:', email);
        console.log('   Password: Mahesa2005@');

    } catch (error) {
        console.error('❌ Error restoring owner account:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreOwnerAccount();
