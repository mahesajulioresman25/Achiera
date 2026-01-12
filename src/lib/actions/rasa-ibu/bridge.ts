
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';

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

                // Sort variants by length DESC so the most specific name matches first
                // e.g. "Sarden Kaleng" matches before "Sarden"
                const sortedVariants = [...variants].sort((a, b) => b.name.length - a.name.length);

                let bestMatch = null;
                // Find matching variant
                for (const v of sortedVariants) {
                    const vName = v.name.toLowerCase();
                    const pName = v.product.name.toLowerCase();
                    const rawLower = raw.toLowerCase();

                    // Check if variant name or product name is inside the raw string
                    // We check vName first as it's more specific than pName usually
                    if (rawLower.includes(vName) || rawLower.includes(pName)) {
                        bestMatch = v;
                        break;
                    }
                }

                if (bestMatch) {
                    // Extract Quantity (handle decimals like 0.5 or 1.5)
                    const numberMatch = raw.match(/(\d+(\.\d+)?)/);
                    let qty = numberMatch ? parseFloat(numberMatch[0]) : 1;

                    // Specific logic for common units (simple heuristic)
                    // If raw contains "kg", and we default to "gram", multiply by 1000
                    if (raw.toLowerCase().includes('kg')) qty *= 1000;

                    matches.push({
                        recipeId: newRecipe.id,
                        ingredientId: bestMatch.id,
                        quantity: qty,
                        unit: 'gram' // Defaulting, user verifies in dashboard
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

        // 6. Award Loyalty Points if Author Phone is present
        let rewardGiven = false;
        if (post.authorPhone) {
            try {
                await loyaltyEngine.awardManualBonus(
                    brandId,
                    post.authorPhone,
                    50000,
                    `Apresiasi Resep: ${post.title} terpilih jadi Menu Resmi!`
                );
                rewardGiven = true;
            } catch (err) {
                console.error('[Reward] Gagal memberikan poin:', err);
            }
        }

        revalidatePath('/dashboard/rasa-ibu/production');
        return {
            success: true,
            data: {
                recipeId: newRecipe.id,
                matchesCount: matches.length,
                rewardGiven
            }
        };

    } catch (error) {
        console.error('Bridge Error:', error);
        return { success: false, error: 'Failed to convert recipe.' };
    }
}
