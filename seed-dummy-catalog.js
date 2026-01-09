const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx3qor60000jp954nkba43d';

async function main() {
    console.log('Seeding dummy data for Rasa Ibu (ID: ' + BRAND_ID + ')...');

    // 1. Create Categories (using frozenCategory)
    const categoryData = [
        { name: 'Makanan Utama', description: 'Nasi, Lauk, dan hidangan berat' },
        { name: 'Minuman Segar', description: 'Es teh, Jus, dan kopi' },
        { name: 'Camilan', description: 'Gorengan dan makanan ringan' }
    ];

    for (const cat of categoryData) {
        const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
        await prisma.frozenCategory.upsert({
            where: { brandId_slug: { brandId: BRAND_ID, slug } },
            update: { name: cat.name, description: cat.description },
            create: {
                brand: { connect: { id: BRAND_ID } },
                name: cat.name,
                slug,
                description: cat.description,
                isActive: true,
                displayOrder: 0
            }
        });
    }

    const dbCats = await prisma.frozenCategory.findMany({ where: { brandId: BRAND_ID } });
    const catMap = Object.fromEntries(dbCats.map(c => [c.name, c.id]));

    // 2. Create Products
    const products = [
        { name: 'Nasi Goreng Spesial', price: 25000, categoryId: catMap['Makanan Utama'], slug: 'nasi-goreng-spesial', weight: 350 },
        { name: 'Ayam Bakar Madu', price: 35000, categoryId: catMap['Makanan Utama'], slug: 'ayam-bakar-madu', weight: 250 },
        { name: 'Es Teh Manis', price: 5000, categoryId: catMap['Minuman Segar'], slug: 'es-teh-manis', weight: 250 },
        { name: 'Kopi Susu Gula Aren', price: 18000, categoryId: catMap['Minuman Segar'], slug: 'kopi-susu-gula-aren', weight: 200 },
        { name: 'Kentang Goreng Platters', price: 20000, categoryId: catMap['Camilan'], slug: 'kentang-goreng-platters', weight: 200 }
    ];

    for (const prod of products) {
        const p = await prisma.frozenProduct.upsert({
            where: { slug: prod.slug },
            update: {
                name: prod.name,
                categoryId: prod.categoryId,
                description: `Menu dummy untuk ${prod.name}`
            },
            create: {
                name: prod.name,
                slug: prod.slug,
                categoryId: prod.categoryId,
                description: `Menu dummy untuk ${prod.name}`,
                storageType: 'READY_TO_EAT',
                shelfLife: 0
            }
        });

        const sku = `RI-${prod.slug.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-REG`;
        await prisma.frozenVariant.upsert({
            where: { sku },
            update: {
                price: prod.price,
                weight: prod.weight,
                stockOnHand: 50
            },
            create: {
                productId: p.id,
                name: 'Reguler',
                sku,
                price: prod.price,
                weight: prod.weight,
                stockOnHand: 50,
                unit: 'porsi'
            }
        });
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
