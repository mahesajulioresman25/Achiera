'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get best selling products based on order count
 * @param limit Number of products to return (default: 6)
 */
export async function getBestSellers(brandId: string, limit: number = 6) {
    try {
        const products = await prisma.frozenProduct.findMany({
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
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0
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
        const products = await prisma.frozenProduct.findMany({
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
            const latestProducts = await prisma.frozenProduct.findMany({
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

            return latestProducts.map((p: any) => ({
                id: p.id,
                slug: p.slug,
                name: p.name,
                category: p.category?.name || '',
                price: Number(p.variants[0]?.price || 0),
                description: p.description || '',
                image: p.image || undefined,
                totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
                inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0
            }));
        }

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0
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
        const currentProduct = await prisma.frozenProduct.findFirst({
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
        const products = await prisma.frozenProduct.findMany({
            where: {
                brandId,
                categoryId: currentProduct.categoryId,
                id: { not: productId },
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
                orderCount: 'desc' // Prioritize popular products
            },
            take: limit
        });

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0
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
        const products = await prisma.frozenProduct.findMany({
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

        return products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || '',
            price: Number(p.variants[0]?.price || 0),
            description: p.description || '',
            image: p.image || undefined,
            totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0),
            inStock: p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0) > 0
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
        const categories = await prisma.frozenCategory.findMany({
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
        const products = await prisma.frozenProduct.findMany({
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
        await prisma.frozenProduct.updateMany({
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
