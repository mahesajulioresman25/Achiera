const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreRasaIbuBrand() {
    try {
        console.log('🔄 Restoring Rasa Ibu brand...');

        const brandId = 'cmjzv932k0000';
        const slug = 'rasa-ibu';
        const name = 'Rasa Ibu';

        // Check if brand exists
        const existingBrand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (existingBrand) {
            console.log('✅ Brand "Rasa Ibu" already exists!');
            console.log('📦 ID:', existingBrand.id);
            console.log('🏷️  Slug:', existingBrand.slug);
            console.log('📛 Name:', existingBrand.name);
            console.log('✨ Active:', existingBrand.isActive);
        } else {
            // Create brand
            const newBrand = await prisma.brand.create({
                data: {
                    id: brandId,
                    slug,
                    name,
                    isActive: true
                }
            });
            console.log('✅ Brand "Rasa Ibu" created successfully!');
            console.log('📦 ID:', newBrand.id);
            console.log('🏷️  Slug:', newBrand.slug);
            console.log('📛 Name:', newBrand.name);
        }

        // Check for BrandConfig
        const brandConfig = await prisma.brandConfig.findUnique({
            where: { brandId }
        });

        if (!brandConfig) {
            console.log('\n📝 Creating BrandConfig...');
            await prisma.brandConfig.create({
                data: {
                    brandId,
                    publicTitle: 'Rasa Ibu',
                    publicSubtitle: 'Hangatnya Meja Makan Keluarga',
                    heroTagline: 'KEJUJURAN DARI DAPUR',
                    level1Enabled: true,
                    level2Enabled: true,
                    level3Enabled: false,
                    emergencyPaused: false
                }
            });
            console.log('✅ BrandConfig created!');
        } else {
            console.log('✅ BrandConfig already exists!');
        }

        console.log('\n🎉 Brand "Rasa Ibu" is ready!');
        console.log('   Access at: http://localhost:3000/rasa-ibu');

    } catch (error) {
        console.error('❌ Error restoring brand:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreRasaIbuBrand();
