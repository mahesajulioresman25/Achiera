
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('🔍 Checking Database Content...');
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: { brandConfig: true }
        });

        if (!brand) {
            console.error('❌ Brand "rasa-ibu" NOT FOUND in database.');
        } else {
            console.log('✅ Brand "rasa-ibu" FOUND.');
            console.log('   ID:', brand.id);
            if (brand.brandConfig) {
                console.log('✅ BrandConfig FOUND.');
                console.log('   Title:', brand.brandConfig.publicTitle);
            } else {
                console.error('❌ BrandConfig is MISSING.');
            }
        }
    } catch (e) {
        console.error('❌ Connection Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
