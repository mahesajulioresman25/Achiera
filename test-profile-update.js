const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProfileUpdate() {
    try {
        console.log('🔍 Testing profile update...');

        // Find the owner user
        const user = await prisma.user.findUnique({
            where: { email: 'mahesajulioresman@achiera.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:', user.email);
        console.log('📝 Current data:');
        console.log('  - Name:', user.name);
        console.log('  - Phone:', user.phone || 'Not set');
        console.log('  - Address:', user.address || 'Not set');
        console.log('  - Profile Image:', user.profileImage ? 'Set' : 'Not set');

        // Try to update
        console.log('\n🔄 Attempting to update phone and address...');
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                phone: '08123456789',
                address: 'Test Address, Jakarta'
            }
        });

        console.log('✅ Update successful!');
        console.log('📝 Updated data:');
        console.log('  - Phone:', updated.phone);
        console.log('  - Address:', updated.address);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testProfileUpdate();
