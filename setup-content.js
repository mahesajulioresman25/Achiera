const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupRasaIbuContent() {
    try {
        console.log('🔄 Setting up Rasa Ibu content with real data...');

        const brandId = 'cmjzv932k0000';

        // Real data for "Our Values" section
        const aboutValuesList = [
            {
                title: 'Higiene Terjamin',
                desc: 'Dibuat di dapur standar tinggi, setiap langkah dipastikan bersih.'
            },
            {
                title: 'Tanpa Pengawet',
                desc: 'Kami menggunakan teknik pembekuan cepat untuk menjaga kualitas.'
            },
            {
                title: 'Resep Warisan',
                desc: 'Bumbu asli nusantara, bukan penyedap rasa buatan berlebih.'
            },
            {
                title: 'Siap Dalam 10 Menit',
                desc: 'Cukup dikukus atau digoreng sebentar, langsung bisa dinikmati.'
            }
        ];

        // Update BrandConfig
        await prisma.brandConfig.upsert({
            where: { brandId },
            create: {
                brandId,
                publicTitle: 'Rasa Ibu',
                publicSubtitle: 'Hangatnya Meja Makan Keluarga',
                heroTagline: 'KEJUJURAN DARI DAPUR',
                level1Enabled: true,
                level2Enabled: true,
                level3Enabled: false,
                emergencyPaused: false,
                aboutValuesTitle: 'Komitmen Kami.',
                aboutValuesList: aboutValuesList
            },
            update: {
                aboutValuesTitle: 'Komitmen Kami.',
                aboutValuesList: aboutValuesList
            }
        });

        console.log('✅ Content updated successfully!');
        console.log('\n📝 Our Values:');
        aboutValuesList.forEach((val, idx) => {
            console.log(`   ${idx + 1}. ${val.title}`);
            console.log(`      ${val.desc}`);
        });

        console.log('\n✅ Data is now connected to CMS!');
        console.log('   You can edit these values in Dashboard → Content → Public View → Our Values');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupRasaIbuContent();
