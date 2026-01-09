
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for "merch" brand...');
    const brand = await prisma.brand.findUnique({
        where: { slug: 'merch' }
    });

    if (brand) {
        console.log('Brand "merch" exists:', brand.id);
    } else {
        console.log('Brand "merch" NOT found. Creating...');
        const newBrand = await prisma.brand.create({
            data: {
                slug: 'merch',
                name: 'ACHIERA Merch',
                merchSettings: {
                    create: {
                        heroMode: 'SINGLE',
                        heroTitle: 'Official Merchandise',
                        heroSubtitle: 'Premium Quality Goods',
                        heroTagline: 'Elevate your style',
                        heroCtaLabel: 'Shop Now',
                        heroCtaLink: '/merchandise',
                        highlightLine: 'New Collection Available',
                        mockupTitle: 'Custom Mockup',
                        mockupSubtitle: 'Create your own',
                        mockupTagline: 'Free to try',
                    }
                }
            }
        });
        console.log('Brand "merch" created:', newBrand.id);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
