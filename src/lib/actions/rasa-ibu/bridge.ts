
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createProductionRecipeFromPost(brandId: string, recipePostId: string) {
    try {
        // 1. Fetch the Public Recipe (RecipePost)
        const post = await prisma.recipePost.findUnique({
            where: { id: recipePostId }
        });

        if (!post) throw new Error('Recipe Post not found');

        // 2. Check if Production Recipe already exists
        const existing = await prisma.recipe.findFirst({
            where: {
                brandId,
                name: post.title
            }
        });

        if (existing) {
            return { success: false, error: 'Production Recipe with this name already exists.' };
        }

        // 3. Create Basic Production Recipe
        const newRecipe = await prisma.recipe.create({
            data: {
                brandId,
                name: post.title,
                description: `Imported from Public Recipe: ${post.title}`,
                outputQuantity: 1, // Default to 1 porsi
                unit: 'porsi',
            }
        });

        // 4. Heuristic Ingredient Matching
        // We will try to match strings in specific keywords to FrozenVariants
        const matches = [];
        const rawIngredients = post.ingredients as string[]; // e.g. ["1 kaleng Sarden", "200g Pete"]

        if (Array.isArray(rawIngredients)) {
            for (const raw of rawIngredients) {
                // Heuristic: Split words, filter out numbers/units, search db
                // Simple approach: search for the whole string first, then parts
                // Actually, let's just try to find a variant that is substring of the raw text
                // e.g. if raw is "1 kaleng Sarden", and variant is "Sarden", "Sarden" is in raw (case insensitive)

                // Get all variants for this brand (cached optimized in real world, here queried)
                // To be efficient, let's just search variants that share words?
                // No, let's fetch all RAW_MATERIAL variants for the brand (usually < 100)
                const variants = await prisma.frozenVariant.findMany({
                    where: {
                        product: {
                            brandId,
                            inventoryType: 'RAW_MATERIAL'
                        }
                    },
                    include: { product: true }
                });

                let bestMatch = null;
                // Find matching variant
                for (const v of variants) {
                    const vName = v.name.toLowerCase();
                    const pName = v.product.name.toLowerCase();
                    const rawLower = raw.toLowerCase();

                    // Check if variant name or product name is inside the raw string
                    if (rawLower.includes(vName) || rawLower.includes(pName)) {
                        bestMatch = v;
                        break; // Take first match
                    }
                }

                if (bestMatch) {
                    // Extract Quantity (heuristic: first number found)
                    const numberMatch = raw.match(/(\d+(\.\d+)?)/);
                    const qty = numberMatch ? parseFloat(numberMatch[0]) : 1;

                    matches.push({
                        recipeId: newRecipe.id,
                        ingredientId: bestMatch.id,
                        quantity: qty,
                        unit: 'gram' // Defaulting to unit, user must verify
                    });
                }
            }
        }

        // 5. Bulk Create Recipe Items
        if (matches.length > 0) {
            await prisma.recipeItem.createMany({
                data: matches
            });
        }

        revalidatePath('/dashboard/rasa-ibu/production');
        return { success: true, data: { recipeId: newRecipe.id, matchesCount: matches.length } };

    } catch (error) {
        console.error('Bridge Error:', error);
        return { success: false, error: 'Failed to convert recipe.' };
    }
}
