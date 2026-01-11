
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 INVESTIGATING RECIPE DATA...\n');

    // 1. Check "RecipePost" (Content/Social/Blog)
    // This is what users create via "Bagikan Resep"
    const posts = await prisma.recipePost.findMany({
        select: { id: true, title: true, isPublished: true, ingredients: true }
    });
    console.log(`📑 found ${posts.length} RECIPE POSTS (Content):`);
    posts.forEach(p => {
        console.log(`   - [${p.title}] (Published: ${p.isPublished})`);
        // console.log(`     Ingredients text: ${JSON.stringify(p.ingredients).slice(0, 50)}...`);
    });

    console.log('\n----------------------------------------\n');

    // 2. Check "Recipe" (Production Master Data)
    // This is what the Production Engine uses
    const productionRecipes = await prisma.recipe.findMany({
        include: { items: { include: { ingredient: true } } }
    });
    console.log(`🏭 found ${productionRecipes.length} PRODUCTION RECIPES (Engine):`);
    productionRecipes.forEach(r => {
        console.log(`   - [${r.name}] (ID: ${r.id})`);
        if (r.items.length === 0) {
            console.log(`     ⚠️  NO LINKED INGREDIENTS (Empty)`);
        } else {
            console.log(`     ✅  ${r.items.length} Ingredients linked:`);
            r.items.forEach(i => console.log(`         * ${i.ingredient.name} (${i.quantity} ${i.unit})`));
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
