
import { createProductionRecipeFromPost } from './src/lib/actions/rasa-ibu/bridge';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌉 TESTING RECIPE BRIDGE...\n');

    // 1. Find the "Sarden" post
    const post = await prisma.recipePost.findFirst({
        where: { title: { contains: 'Sarden' } }
    });

    if (!post) {
        console.error('❌ RecipePost "Sarden" not found!');
        return;
    }
    console.log(`✅ Found Post: ${post.title} (${post.id})`);

    // 2. Simulate Bridge Action
    // Hardcoded for verification based on known active brand
    const brandId = 'cmk4d93020000356c5476d655'; // Use the known brand ID
    // const user = await prisma.user.findFirst();
    // const brandId = user?.brandId;

    if (!brandId) {
        console.error('❌ No brandId found');
        return;
    }

    console.log(`🔄 Converting to Production Recipe for Brand: ${brandId}...`);
    const result = await createProductionRecipeFromPost(brandId, post.id);

    if (result.success) {
        console.log(`✅ SUCCESS! Recipe Created.`);
        console.log(`   ID: ${result.data?.recipeId}`);
        console.log(`   Matches: ${result.data?.matchesCount} ingredients linked.`);

        // 3. Verify the Created Recipe
        const newRecipe = await prisma.recipe.findUnique({
            where: { id: result.data?.recipeId },
            include: { items: { include: { ingredient: true } } }
        });

        console.log('\n📋 VERIFICATION:');
        console.log(`   Name: ${newRecipe?.name}`);
        console.log(`   Items:`);
        newRecipe?.items.forEach(item => {
            console.log(`     - ${item.ingredient.name} (${item.quantity} ${item.unit})`);
        });

    } else {
        console.error(`❌ FAILED: ${result.error}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
