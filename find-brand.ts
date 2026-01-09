import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.upsert({
        where: { slug: 'rasa-ibu' },
        update: {},
        create: {
            name: 'RASA IBU',
            slug: 'rasa-ibu',
        },
    });
    console.log('Brand Found/Created:', brand.id);

    // Seed Initial Products for RASA IBU
    const products = [
        { name: 'Rendang Daging Mande', category: 'Lauk Matang', stock: 42 },
        { name: 'Ayam Goreng Lengkuas', category: 'Lauk Matang', stock: 3 },
        { name: 'Dendeng Balado Batokok', category: 'Lauk Matang', stock: 12 },
        { name: 'Gulai Daun Singkong', category: 'Sayuran', stock: 15 },
    ];

    for (const p of products) {
        // Find existing category or create
        const category = await prisma.frozenCategory.upsert({
            where: { brandId_slug: { brandId: brand.id, slug: p.category.toLowerCase().replace(' ', '-') } },
            update: {},
            create: {
                brandId: brand.id,
                name: p.category,
                slug: p.category.toLowerCase().replace(' ', '-'),
            },
        });

        // Create product + variant
        await prisma.frozenProduct.upsert({
            where: { slug: p.name.toLowerCase().replace(' ', '-') },
            update: {},
            create: {
                categoryId: category.id,
                name: p.name,
                slug: p.name.toLowerCase().replace(' ', '-'),
                storageType: 'FREEZER',
                variants: {
                    create: {
                        name: 'Reguler',
                        sku: `RI-${p.name.substring(0, 3).toUpperCase()}-REG`,
                        price: 85000,
                        weight: 0.5,
                        stockOnHand: p.stock
                    }
                }
            },
        });
    }
    console.log('Seeding Completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
