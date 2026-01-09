
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brandSlug = 'rasa-ibu'; // Slug brand Anda
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

    if (!brand) {
        console.error('Brand Raza Ibu not found');
        return;
    }

    const inventoryCategories = [
        { name: 'Sayuran Segar', type: 'RAW_MATERIAL' },
        { name: 'Daging & Protein', type: 'RAW_MATERIAL' },
        { name: 'Bumbu & Rempah', type: 'RAW_MATERIAL' },
        { name: 'Sembako & Minyak', type: 'RAW_MATERIAL' },
        { name: 'Dairy & Produk Susu', type: 'RAW_MATERIAL' },
        { name: 'Frozen Ingredient', type: 'RAW_MATERIAL' },
        { name: 'Packaging Primer (Kontak Makanan)', type: 'PACKAGING' },
        { name: 'Packaging Sekunder (Dus/Tas)', type: 'PACKAGING' },
        { name: 'Perlengkapan Kebersihan', type: 'SUPPLY' },
        { name: 'Alat Tulis Kantor', type: 'SUPPLY' },
    ];

    console.log(`Seeding inventory categories for brand: ${brand.name}...`);

    for (const cat of inventoryCategories) {
        const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await prisma.inventoryCategory.upsert({
            where: {
                brandId_slug: {
                    brandId: brand.id,
                    slug: slug
                }
            },
            update: {},
            create: {
                brandId: brand.id,
                name: cat.name,
                slug: slug,
                type: cat.type
            }
        });
        console.log(`- Upserted: ${cat.name}`);
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
