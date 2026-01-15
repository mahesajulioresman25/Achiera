import { MetadataRoute } from 'next';
import { unisolatedPrisma as prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rasaibu.com';

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/rasa-ibu',
        '/rasa-ibu/products',
        '/rasa-ibu/recipes',
        '/rasa-ibu/about',
        '/rasa-ibu/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Products
    // Assuming 'rasa-ibu' creates products linked to Category in 'frozen_categories' or similiar?
    // Wait, Product page uses Category filter. But where does it get products?
    // It fetches FrozenProduct.

    const products = await prisma.frozenProduct.findMany({
        select: { slug: true, updatedAt: true },
        // Ideally filter by brand if FrozenProduct had brandId, but it seems to be category based.
        // We assume all FrozenProducts are visible for now as per current products page logic.
    });

    const productRoutes = products.map((product: any) => ({
        url: `${baseUrl}/rasa-ibu/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 3. Dynamic Recipes
    const recipes = await prisma.recipePost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
    });

    const recipeRoutes = recipes.map((recipe: any) => ({
        url: `${baseUrl}/rasa-ibu/recipes/${recipe.slug}`,
        lastModified: recipe.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...recipeRoutes];
}
