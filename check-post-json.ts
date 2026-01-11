
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const post = await prisma.recipePost.findFirst({
        where: { title: { contains: 'Sarden' } }
    });

    if (post) {
        console.log(`Title: ${post.title}`);
        console.log('Ingredients Raw:', JSON.stringify(post.ingredients, null, 2));
    } else {
        console.log('No Sarden recipe found.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
