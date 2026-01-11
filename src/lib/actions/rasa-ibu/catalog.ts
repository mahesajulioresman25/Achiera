'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { InventoryType } from '@prisma/client';

/**
 * Creates a new Frozen Product with an initial variant.
 */
export async function createProduct(data: {
    brandId: string;
    categoryId: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    costPrice?: number;
    weight: number;
    image?: string;
    images?: string[];
    ingredients?: string;
    nutrition?: any;
    storageType?: string;
    shelfLife?: number;
    unit?: string;
    inventoryCategoryId?: string; // New field for internal category
    isFeatured?: boolean;
    featuredOrder?: number;
}) {
    try {
        const product = await (prisma.frozenProduct.create as any)({
            data: {
                categoryId: data.categoryId || undefined,
                inventoryCategoryId: data.inventoryCategoryId || undefined,
                name: data.name,
                slug: data.slug,
                description: data.description,
                image: data.image,
                storageType: data.storageType || 'FROZEN',
                shelfLife: data.shelfLife || 6, // Default 6 months
                ingredients: data.ingredients,
                nutrition: data.nutrition,
                isFeatured: data.isFeatured ?? false,
                featuredOrder: data.featuredOrder ?? 0,
                variants: {
                    create: {
                        name: 'Reguler',
                        sku: `RI-${data.slug.toUpperCase()}-REG`,
                        price: data.price,
                        weight: data.weight,
                        unit: data.unit || 'pcs',
                        stockOnHand: 0,
                        ...({ costPrice: data.costPrice || 0 } as any)
                    }
                }
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        revalidatePath('/rasa-ibu/products');
        return { success: true, data: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        console.error('Create Product Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates an existing Frozen Product and its primary variant.
 */
export async function updateProduct(data: {
    id: string;
    name: string;
    description: string;
    price: number;
    costPrice?: number;
    weight: number;
    image?: string;
    images?: string[];
    ingredients?: string;
    nutrition?: any;
    storageType?: string;
    shelfLife?: number;
    unit?: string;
    categoryId?: string;
    inventoryCategoryId?: string;
    isFeatured?: boolean;
    featuredOrder?: number;
}) {
    try {
        const product = await prisma.frozenProduct.update({
            where: { id: data.id, brandId: (data as any).brandId },
            data: {
                name: data.name,
                description: data.description,
                image: data.image,
                storageType: data.storageType || 'FROZEN',
                shelfLife: data.shelfLife || 6,
                ingredients: data.ingredients,
                nutrition: data.nutrition,
                categoryId: data.categoryId,
                ...(data.inventoryCategoryId ? { inventoryCategoryId: data.inventoryCategoryId } : {}) as any,
                isFeatured: data.isFeatured,
                featuredOrder: data.featuredOrder,
                variants: {
                    updateMany: {
                        where: { productId: data.id, brandId: (data as any).brandId },
                        data: {
                            price: data.price,
                            weight: data.weight,
                            unit: data.unit,
                            ...({ costPrice: data.costPrice || 0 } as any)
                        }
                    }
                }
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        revalidatePath(`/rasa-ibu/products`);
        return { success: true, data: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Deletes a product.
 * NOTE: In production, consider soft-delete if there are order histories.
 */
export async function deleteProduct(id: string, brandId: string) {
    try {
        // First delete variants due to foreign key constraints if not Cascade
        await prisma.frozenVariant.deleteMany({ where: { productId: id, brandId } });
        await prisma.frozenProduct.delete({ where: { id, brandId } });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Helper to fetch PUBLIC categories (FrozenCategory)
 */
export async function getIbuCategories(brandId: string) {
    const categories = await prisma.frozenCategory.findMany({
        where: { brandId },
        orderBy: { displayOrder: 'asc' } as any // Sorted by display order
    });
    return JSON.parse(JSON.stringify(categories));
}

/**
 * Helper to fetch INTERNAL categories (InventoryCategory)
 */
export async function getInventoryCategories(brandId: string, type?: InventoryType) {
    const categories = await (prisma as any).inventoryCategory.findMany({
        where: {
            brandId,
            ...(type ? { type } : {})
        },
        orderBy: { name: 'asc' }
    });
    return JSON.parse(JSON.stringify(categories));
}

/**
 * Get all frozen products with variants for the brand
 */
export async function getFrozenProducts(brandId: string) {
    try {
        const products = await prisma.frozenProduct.findMany({
            where: {
                category: { brandId }
            },
            include: {
                category: true,
                inventoryCategory: true,
                variants: {
                    select: { id: true, name: true, sku: true, price: true, weight: true, costPrice: true, unit: true }
                }
            } as any,
            orderBy: { name: 'asc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(products)) };
    } catch (error: any) {
        console.error('Error fetching frozen products:', error);
        return { success: false, error: 'Failed to fetch products' };
    }
}

/**
 * Upsert a category (Create or Update)
 */
export async function upsertIbuCategory(data: {
    id?: string;
    brandId: string;
    name: string;
    description?: string;
    isActive?: boolean;
    displayOrder?: number;
}) {
    try {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-');

        // Safer approach: Split Update and Create to ensure brandId is respected
        // and avoid potential missing composite key issues in Prisma Schema

        let category;

        if (data.id) {
            // Check if exists and belongs to brand
            const existing = await prisma.frozenCategory.findFirst({
                where: { id: data.id, brandId: data.brandId }
            });

            if (!existing) {
                return { success: false, error: 'Kategori tidak ditemukan atau akses ditolak' };
            }

            category = await prisma.frozenCategory.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    slug,
                    description: data.description,
                    isActive: data.isActive,
                    displayOrder: data.displayOrder
                }
            });
        } else {
            // Create new
            // Cannot use upsert() because Brand Isolation Middleware fails to detect brandId inside composite key 'brandId_slug'
            // So we use findFirst -> update/create pattern

            const existingBySlug = await prisma.frozenCategory.findFirst({
                where: {
                    brandId: data.brandId,
                    slug: slug
                }
            });

            if (existingBySlug) {
                // Update existing slug match
                category = await prisma.frozenCategory.update({
                    where: { id: existingBySlug.id },
                    data: {
                        name: data.name,
                        description: data.description,
                        isActive: data.isActive,
                        displayOrder: data.displayOrder
                    }
                });
            } else {
                // Create completely new
                category = await prisma.frozenCategory.create({
                    data: {
                        brandId: data.brandId,
                        name: data.name,
                        slug,
                        description: data.description,
                        isActive: data.isActive ?? true,
                        displayOrder: data.displayOrder ?? 0
                    }
                });
            }
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(category)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Upsert an INVENTORY category (Internal)
 */
export async function upsertInventoryCategory(data: {
    id?: string;
    brandId: string;
    name: string;
    type: InventoryType;
}) {
    try {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-');
        const category = await (prisma as any).inventoryCategory.upsert({
            where: {
                brandId_slug: { brandId: data.brandId, slug }
            },
            create: {
                brandId: data.brandId,
                name: data.name,
                slug,
                type: data.type
            } as any,
            update: {
                name: data.name,
                type: data.type
            } as any
        });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(category)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete a category (with usage check)
 */
export async function deleteIbuCategory(id: string, brandId: string) {
    try {
        // Check if category has products
        const productsCount = await prisma.frozenProduct.count({
            where: { categoryId: id, brandId }
        });

        if (productsCount > 0) {
            return {
                success: false,
                error: `Tidak bisa menghapus kategori ini karena masih digunakan oleh ${productsCount} produk. Pindahkan produknya terlebih dahulu.`
            };
        }

        await prisma.frozenCategory.delete({ where: { id, brandId } });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete an INVENTORY category
 */
export async function deleteInventoryCategory(id: string, brandId: string) {
    try {
        const productsCount = await prisma.frozenProduct.count({
            where: { inventoryCategoryId: id, brandId } as any
        });

        if (productsCount > 0) {
            return {
                success: false,
                error: `Tidak bisa menghapus kategori ini karena masih digunakan oleh ${productsCount} item.`
            };
        }

        await (prisma as any).inventoryCategory.delete({ where: { id, brandId } });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
