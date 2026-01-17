'use server';

import { unisolatedPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Helper to fetch and calculate ratings for a list of products
 */
export async function getProductRatings(brandId: string, productNames: string[]) {
    try {
        const ratings = await (unisolatedPrisma as any).customerReview.groupBy({
            by: ['productName'],
            where: {
                brandId,
                platform: 'WEBSITE',
                productName: { in: productNames }
            },
            _avg: { rating: true },
            _count: { rating: true }
        });

        const ratingMap: Record<string, { avg: number, count: number }> = {};
        ratings.forEach((r: any) => {
            ratingMap[r.productName] = {
                avg: Number(r._avg.rating || 0),
                count: r._count.rating || 0
            };
        });

        return ratingMap;
    } catch (error) {
        console.error('Error fetching product ratings:', error);
        return {};
    }
}

/**
 * Get best selling products based on order count
 * @param limit Number of products to return (default: 6)
 */
export async function getBestSellers(brandId: string, limit: number = 6) {
    try {
        const products = await unisolatedPrisma.frozenProduct.findMany({
            where: {
                category: { brandId },
                inventoryType: 'FINISHED_GOOD',
                variants: {
                    some: {
                        stockOnHand: { gt: 0 }
                    }
                }
            },
            include: {
                variants: true,
                category: true
            },
            orderBy: {
                orderCount: 'desc'
            },
            take: limit
        });

        const productNames = products.map(p => p.name);
        const ratingMap = await getProductRatings(brandId, productNames);

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            variantId: p.variants[0]?.id,
            description: p.description || '',
            image: p.image || undefined,
            orderCount: p.orderCount,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0,
            rating: ratingMap[p.name]?.avg || 5.0, // Fallback to 5.0 if no reviews
            reviewCount: ratingMap[p.name]?.count || 0
        }));
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return [];
    }
}

/**
 * Get featured products (manually curated)
 */
export async function getFeaturedProducts(brandId: string) {
    try {
        const products = await unisolatedPrisma.frozenProduct.findMany({
            where: {
                category: { brandId },
                isFeatured: true,
                inventoryType: 'FINISHED_GOOD'
            },
            include: {
                variants: true,
                category: true
            },
            orderBy: {
                featuredOrder: 'asc'
            }
        });

        // If no featured products, fallback to best sellers
        if (products.length === 0) {
            const bestSellers = await getBestSellers(brandId, 3);
            if (bestSellers.length > 0) return bestSellers;

            // Final fallback: Get ANY active products (New Arrivals)
            const latestProducts = await unisolatedPrisma.frozenProduct.findMany({
                where: {
                    category: { brandId },
                    inventoryType: 'FINISHED_GOOD',
                    // isActive: true // Assuming default is active, or add check if field exists
                },
                include: {
                    variants: true,
                    category: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 6
            });

            const productNames = latestProducts.map(p => p.name);
            const ratingMap = await getProductRatings(brandId, productNames);

            return latestProducts.map((p: any) => ({
                id: p.id,
                slug: p.slug,
                name: p.name,
                category: p.category?.name || '',
                price: Number(p.variants[0]?.price || 0),
                description: p.description || '',
                image: p.image || undefined,
                totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
                inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0,
                rating: ratingMap[p.name]?.avg || 5.0,
                reviewCount: ratingMap[p.name]?.count || 0
            }));
        }

        const productNames = products.map(p => p.name);
        const ratingMap = await getProductRatings(brandId, productNames);

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0,
            rating: ratingMap[p.name]?.avg || 5.0,
            reviewCount: ratingMap[p.name]?.count || 0
        }));
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}

/**
 * Get recommended products based on same category
 * @param brandId Brand ID
 * @param productId Current product ID
 * @param limit Number of recommendations (default: 4)
 */
export async function getRecommendedProducts(brandId: string, productId: string, limit: number = 4) {
    try {
        // Get current product to find its category
        const currentProduct = await unisolatedPrisma.frozenProduct.findFirst({
            where: {
                brandId,
                id: productId
            },
            select: { categoryId: true }
        });

        if (!currentProduct?.categoryId) {
            return [];
        }

        // Get products from same category, excluding current product
        // Removed strict stock check to ensure recommendations appear
        let products = await unisolatedPrisma.frozenProduct.findMany({
            where: {
                brandId,
                categoryId: currentProduct.categoryId,
                id: { not: productId },
                inventoryType: 'FINISHED_GOOD',
                // Relaxed stock check for now
            },
            include: {
                variants: true,
                category: true
            },
            orderBy: {
                orderCount: 'desc' // Prioritize popular products
            },
            take: limit
        });

        // Fallback: If not enough related products, fetch Best Sellers (random/popular)
        if (products.length < limit) {
            const needed = limit - products.length;
            const existingIds = [productId, ...products.map(p => p.id)];

            const fallbackProducts = await unisolatedPrisma.frozenProduct.findMany({
                where: {
                    brandId,
                    inventoryType: 'FINISHED_GOOD',
                    id: { notIn: existingIds }
                },
                include: {
                    variants: true,
                    category: true
                },
                orderBy: {
                    orderCount: 'desc'
                },
                take: needed
            });

            products = [...products, ...fallbackProducts];
        }

        const productNames = products.map(p => p.name);
        const ratingMap = await getProductRatings(brandId, productNames);

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0,
            rating: ratingMap[p.name]?.avg || 5.0,
            reviewCount: ratingMap[p.name]?.count || 0
        }));
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

/**
 * Get products by category slug
 */
export async function getProductsByCategory(brandId: string, categorySlug: string) {
    try {
        const products = await unisolatedPrisma.frozenProduct.findMany({
            where: {
                category: {
                    brandId,
                    slug: categorySlug
                },
                inventoryType: 'FINISHED_GOOD'
            },
            include: {
                variants: true,
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        const productNames = products.map(p => p.name);
        const ratingMap = await getProductRatings(brandId, productNames);

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0,
            rating: ratingMap[p.name]?.avg || 5.0,
            reviewCount: ratingMap[p.name]?.count || 0
        }));
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
}

/**
 * Get all categories for a brand
 */
export async function getCategories(brandId: string) {
    try {
        const categories = await unisolatedPrisma.frozenCategory.findMany({
            where: {
                brandId,
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                inventoryType: 'FINISHED_GOOD'
                            }
                        }
                    }
                }
            },
            orderBy: {
                displayOrder: 'asc'
            }
        });

        return categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            image: c.image,
            productCount: c._count.products
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function getProductsByIdsAction(brandId: string, ids: string[]) {
    try {
        const products = await unisolatedPrisma.frozenProduct.findMany({
            where: {
                brandId,
                id: { in: ids }
            },
            include: {
                variants: {
                    take: 1
                },
                category: true
            }
        });

        return {
            success: true,
            data: products.map((p: any) => ({
                id: p.id,
                slug: p.slug,
                name: p.name,
                price: Number(p.variants[0]?.price || 0),
                image: p.image
            }))
        };
    } catch (error) {
        console.error('[getProductsByIdsAction] Error:', error);
        return { success: false, error: 'Gagal memuat produk' };
    }
}

/**
 * Increment view count for a product
 */
export async function incrementProductView(brandId: string, productId: string) {
    try {
        await unisolatedPrisma.frozenProduct.updateMany({
            where: {
                brandId,
                id: productId
            },
            data: {
                viewCount: { increment: 1 }
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error incrementing view count:', error);
        return { success: false };
    }
}
