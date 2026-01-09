
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

async function main() {
    console.log('Fixing product slugs...');
    const products = await prisma.frozenProduct.findMany();

    for (const product of products) {
        const newSlug = slugify(product.name);
        if (product.slug !== newSlug) {
            console.log(`Updating "${product.name}": "${product.slug}" -> "${newSlug}"`);
            await prisma.frozenProduct.update({
                where: { id: product.id },
                data: { slug: newSlug }
            });
        }
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
