const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupRealProfileData() {
    try {
        console.log('🔄 Setting up real profile data for testing...');

        // Update owner account with complete profile
        const updatedUser = await prisma.user.update({
            where: { email: 'mahesajulioresman@achiera.com' },
            data: {
                name: 'Mahesa Julio Resman',
                phone: '081234567890',
                address: 'Jl. Contoh No. 123, RT 01/RW 02, Kelurahan Contoh, Kecamatan Contoh, Jakarta Selatan 12345',
                profileImage: null // Will be set via upload
            }
        });

        console.log('✅ Profile data updated successfully!');
        console.log('\n📝 Current profile:');
        console.log('  👤 Name:', updatedUser.name);
        console.log('  📧 Email:', updatedUser.email);
        console.log('  📱 Phone:', updatedUser.phone);
        console.log('  📍 Address:', updatedUser.address);
        console.log('  🖼️  Profile Image:', updatedUser.profileImage || 'Not set (upload via UI)');

        console.log('\n✅ Ready for testing!');
        console.log('   Login with: mahesajulioresman@achiera.com / Mahesa2005@');
        console.log('   Profile page: http://localhost:3000/rasa-ibu/profile');
        console.log('   Edit profile: http://localhost:3000/rasa-ibu/profile/edit');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupRealProfileData();
