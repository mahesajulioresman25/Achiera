'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get all published recipes for a brand
 */
export async function getPublishedRecipes(brandId: string, category?: string, author?: string, search?: string) {
    try {
        const recipes = await (prisma as any).recipePost.findMany({
            where: {
                brandId,
                isPublished: true,
                ...(category && category !== 'Semua' ? { category } : {}),
                ...(author ? { authorName: { contains: author, mode: 'insensitive' } } : {}),
                ...(search ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { tags: { has: search } }
                    ]
                } : {})
            },
            orderBy: [
                { isFeatured: 'desc' },
                { likesCount: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 50
        });

        return recipes;
    } catch (error) {
        console.error('[getPublishedRecipes] Error:', error);
        return [];
    }
}

/**
 * Get recipe categories with count
 */
export async function getRecipeCategories(brandId: string) {
    try {
        const categories = await (prisma as any).recipePost.groupBy({
            by: ['category'],
            where: {
                brandId,
                isPublished: true
            },
            _count: {
                category: true
            }
        });

        return categories.map((c: any) => ({
            name: c.category,
            count: c._count.category
        }));
    } catch (error) {
        console.error('[getRecipeCategories] Error:', error);
        return [];
    }
}

/**
 * Get product categories (for products page filter)
 */
export async function getProductCategories(brandId: string) {
    try {
        const categories = await prisma.category.findMany({
            where: {
                brandId,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });

        return categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug
        }));
    } catch (error) {
        console.error('[getProductCategories] Error:', error);
        return [];
    }
}

/**
 * Get single recipe by slug
 */
export async function getRecipeBySlug(brandId: string, slug: string) {
    try {
        const recipe = await (prisma as any).recipePost.findFirst({
            where: {
                brandId,
                slug,
                isPublished: true
            },
            include: {
                comments: {
                    where: { isApproved: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!recipe) return null;

        // Fetch related product slug manually for Smart CTA
        let relatedProductSlug = null;
        if (recipe.productIds && recipe.productIds.length > 0) {
            const product = await unisolatedPrisma.frozenProduct.findFirst({
                where: { id: recipe.productIds[0] },
                select: { slug: true }
            });
            if (product) relatedProductSlug = product.slug;
        }

        // Increment views (fire and forget)
        (prisma as any).recipePost.update({
            where: { id: recipe.id, brandId },
            data: { views: { increment: 1 } }
        }).catch(console.error);

        return {
            ...recipe,
            relatedProductSlug
        };
    } catch (error) {
        console.error('[getRecipeBySlug] Error:', error);
        return null;
    }
}

/**
 * Get related recipes from same category
 */
export async function getRelatedRecipes(brandId: string, category: string, currentId: string, limit = 3) {
    try {
        const recipes = await (prisma as any).recipePost.findMany({
            where: {
                brandId,
                category,
                isPublished: true,
                id: { not: currentId }
            },
            orderBy: { likesCount: 'desc' },
            take: limit
        });

        return recipes;
    } catch (error) {
        console.error('[getRelatedRecipes] Error:', error);
        return [];
    }
}

/**
 * Toggle recipe like count (Robust Version)
 */
export async function toggleRecipeLike(brandId: string, recipeId: string, userId: string) {
    try {
        const existingLike = await (prisma as any).recipeLike.findUnique({
            where: { recipeId_userId: { recipeId, userId } }
        });

        if (existingLike) {
            await (prisma as any).recipeLike.delete({
                where: { id: existingLike.id }
            });
            const recipe = await (prisma as any).recipePost.update({
                where: { id: recipeId, brandId },
                data: { likesCount: { decrement: 1 } }
            });
            return { success: true, isLiked: false, likes: recipe.likesCount };
        } else {
            await (prisma as any).recipeLike.create({
                data: { recipeId, userId }
            });
            const recipe = await (prisma as any).recipePost.update({
                where: { id: recipeId, brandId },
                data: { likesCount: { increment: 1 } }
            });
            return { success: true, isLiked: true, likes: recipe.likesCount };
        }
    } catch (error) {
        console.error('[toggleRecipeLike] Error:', error);
        return { success: false, error: 'Failed' };
    }
}

/**
 * Add a comment to a recipe
 */
export async function addRecipeComment(recipeId: string, data: { content: string, authorName: string, rating: number }) {
    try {
        await (prisma as any).recipeComment.create({
            data: {
                recipeId,
                content: data.content,
                authorName: data.authorName,
                rating: data.rating,
                isApproved: false // Requires admin moderation
            }
        });
        return { success: true };
    } catch (error) {
        console.error('[addRecipeComment] Error:', error);
        return { success: false, error: 'Failed to post comment' };
    }
}

/**
 * CRUD: Create/Submit Recipe
 */
export async function createRecipePost(brandId: string, data: any) {
    try {
        const slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const recipe = await (prisma as any).recipePost.create({
            data: {
                brandId,
                slug,
                ...data,
                isPublished: false // Submission needs approval
            }
        });
        revalidatePath('/rasa-ibu/recipes');
        return { success: true, data: recipe };
    } catch (error) {
        console.error('[createRecipePost] Error:', error);
        return { success: false, error: 'Failed to submit recipe' };
    }
}

/**
 * CRUD: Update Recipe (Admin)
 */
export async function updateRecipePost(brandId: string, recipeId: string, data: any) {
    try {
        const recipe = await (prisma as any).recipePost.update({
            where: { id: recipeId, brandId },
            data
        });
        revalidatePath(`/rasa-ibu/recipes/${recipe.slug}`);
        return { success: true, data: recipe };
    } catch (error) {
        console.error('[updateRecipePost] Error:', error);
        return { success: false, error: 'Failed to update recipe' };
    }
}

/**
 * Admin: Get all recipes (for management)
 */
export async function getAllRecipes(brandId: string) {
    try {
        return await (prisma as any).recipePost.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        return [];
    }
}
