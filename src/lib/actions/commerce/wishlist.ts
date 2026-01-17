'use server';

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Toggles a product in the user's wishlist
 */
export async function toggleWishlistAction(productId: string, brandId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Silakan login untuk menyimpan favorit Bunda.' };
        }

        const userId = session.user.id;

        // Check if already exists
        const existing = await prisma.productWishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            }
        });

        if (existing) {
            // Remove
            await prisma.productWishlist.delete({
                where: { id: existing.id }
            });
            return { success: true, active: false, message: 'Dihapus dari Favorit.' };
        } else {
            // Add
            await prisma.productWishlist.create({
                data: {
                    userId,
                    productId,
                    brandId
                }
            });
            return { success: true, active: true, message: 'Ditambahkan ke Favorit Bunda! ❤️' };
        }
    } catch (error) {
        console.error('[toggleWishlistAction] Error:', error);
        return { success: false, error: 'Gagal memperbarui favorit.' };
    }
}

/**
 * Gets all favorited product IDs for the current user
 */
export async function getUserWishlistAction(brandId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: true, data: [] };
        }

        const wishlists = await prisma.productWishlist.findMany({
            where: {
                userId: session.user.id,
                brandId
            },
            select: {
                productId: true
            }
        });

        return { success: true, data: wishlists.map(w => w.productId) };
    } catch (error) {
        console.error('[getUserWishlistAction] Error:', error);
        return { success: false, error: 'Gagal memuat list favorit.' };
    }
}

/**
 * Gets the actual product data for the wishlist (used in Profile)
 */
export async function getWishlistProductsAction(brandId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Silakan login.' };
        }

        const wishlistItems = await prisma.productWishlist.findMany({
            where: {
                userId: session.user.id,
                brandId
            },
            include: {
                product: {
                    include: {
                        variants: {
                            take: 1
                        },
                        category: true
                    }
                }
            }
        });

        // Use the same helper or similar logic to enrich with ratings
        const products = wishlistItems.map(item => item.product);
        const productNames = products.map(p => p.name);

        // Dynamic import to avoid circular dependencies if needed, but should be fine
        const { getProductRatings } = await import('@/lib/actions/rasa-ibu/public-products');
        const ratingMap = await getProductRatings(brandId, productNames);

        return {
            success: true,
            data: wishlistItems.map((item: any) => {
                const p = item.product;
                const firstVariant = p.variants[0];
                return {
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    category: p.category?.name || 'Menu',
                    price: Number(firstVariant?.price || 0),
                    image: p.image,
                    rating: ratingMap[p.name]?.avg || 5.0,
                    reviewCount: ratingMap[p.name]?.count || 0
                };
            })
        };
    } catch (error) {
        console.error('[getWishlistProductsAction] Error:', error);
        return { success: false, error: 'Gagal memuat detail favorit.' };
    }
}
