'use server';

import { prisma } from '@/lib/prisma';

/**
 * Get all published recipes for a brand
 */
export async function getPublishedRecipes(brandId: string, category?: string) {
    try {
        const recipes = await (prisma as any).recipePost.findMany({
            where: {
                brandId,
                isPublished: true,
                ...(category && category !== 'Semua' ? { category } : {})
            },
            orderBy: [
                { isFeatured: 'desc' },
                { likes: 'desc' },
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

        return categories.map(c => ({
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
            }
        });

        if (!recipe) return null;

        // Increment views (fire and forget)
        (prisma as any).recipePost.update({
            where: { id: recipe.id },
            data: { views: { increment: 1 } }
        }).catch(console.error);

        return recipe;
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
            orderBy: { likes: 'desc' },
            take: limit
        });

        return recipes;
    } catch (error) {
        console.error('[getRelatedRecipes] Error:', error);
        return [];
    }
}
