
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixVariantBrandId() {
    try {
        console.log("🛠️ Fixing Brand IDs for Variants...");

        // 1. Find Rasa Ibu Brand
        // We look for a brand with slug 'rasa-ibu' or name 'Rasa Ibu'
        const brand = await prisma.brand.findFirst({
            where: {
                OR: [
                    { slug: 'rasa-ibu' },
                    { name: { contains: 'Rasa Ibu', mode: 'insensitive' } }
                ]
            }
        });

        if (!brand) {
            console.error("❌ 'Rasa Ibu' Brand not found! Cannot proceed.");
            return;
        }

        console.log(`✅ Found Brand: ${brand.name} (${brand.id})`);

        // 2. Update Products with null brandId
        const productsUpdate = await prisma.frozenProduct.updateMany({
            where: {
                OR: [
                    { name: { in: ['susu uht trial', 'test'] } },
                    { brandId: null } // Optional: Fix all orphans? Let's just fix target ones first to be safe, or just fix all?
                    // Let's safe fix specifically the ones we know are broken first + any referencing them
                ],
                // brandId: null // We want to force update even if set wrong? No, just update nulls or specific ones.
                brandId: null
            },
            data: { brandId: brand.id }
        });

        console.log(`Updated ${productsUpdate.count} Products to Brand ID ${brand.id}`);

        // 3. Update Variants with null brandId
        // We can filtered by product name 'susu uht trial' and 'test' via relation, but updateMany doesn't support relation filtering well in all versions.
        // We'll update all variants where product has the brandId we just set, or just update orphans.

        // Let's update variants specifically for these products or just orphans
        // Safer to find them first then update, or updateMany with ID list if needed.
        // Actually, let's just update all variants that have null brandId AND whose product now has brandId

        const variantsUpdate = await prisma.frozenVariant.updateMany({
            where: {
                brandId: null, // Only orphans
                // product: { brandId: brand.id } // Prisma doesn't support this deep filter in updateMany easily
            },
            data: { brandId: brand.id }
        });

        console.log(`Updated ${variantsUpdate.count} Variants to Brand ID ${brand.id}`);

        // Verify
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: {
                    name: { in: ['susu uht trial', 'test'] }
                }
            },
            select: { id: true, name: true, brandId: true, product: { select: { name: true } } }
        });

        console.log("\n--- VERIFICATION ---");
        variants.forEach(v => {
            console.log(`Variant: ${v.product.name} (${v.name}) -> BrandId: ${v.brandId}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixVariantBrandId();
