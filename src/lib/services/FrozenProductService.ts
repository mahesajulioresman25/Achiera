// ACHIERA Platform - Frozen Product Service
// Product CRUD operations for Frozen Food module

import { prisma } from '@/lib/prisma';
import type { ServiceContext } from './WarehouseService';

export type CreateProductInput = {
    categoryId: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    ingredients?: string;
    nutrition?: any;
    storageType: string;
    shelfLife?: number;
    variants: Array<{
        name: string;
        sku: string;
        price: number;
        weight: number;
    }>;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export class FrozenProductService {
    /**
     * Create product with variants
     */
    async createProduct(ctx: ServiceContext, input: CreateProductInput) {
        return prisma.$transaction(async (tx: any) => {
            // 1. Verify category belongs to brand
            const category = await tx.frozenCategory.findUnique({
                where: { id: input.categoryId }
            });

            if (!category || category.brandId !== ctx.brandId) {
                throw new Error('Category not found or does not belong to brand');
            }

            // 2. Create product
            const product = await tx.frozenProduct.create({
                data: {
                    brandId: ctx.brandId,
                    categoryId: input.categoryId,
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    image: input.image,
                    ingredients: input.ingredients,
                    nutrition: input.nutrition,
                    storageType: input.storageType,
                    shelfLife: input.shelfLife
                }
            });

            // 3. Create variants
            for (const variant of input.variants) {
                await tx.frozenVariant.create({
                    data: {
                        productId: product.id,
                        name: variant.name,
                        sku: variant.sku,
                        price: variant.price,
                        weight: variant.weight
                    }
                });
            }

            // 4. Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'PRODUCT_CREATE',
                    entityType: 'FROZEN_PRODUCT',
                    entityId: product.id,
                    metadata: { name: product.name, slug: product.slug }
                }
            });

            return product;
        });
    }

    /**
     * Update product
     */
    async updateProduct(
        ctx: ServiceContext,
        productId: string,
        input: UpdateProductInput
    ) {
        return prisma.$transaction(async (tx: any) => {
            // 1. Verify product belongs to brand
            const product = await tx.frozenProduct.findUnique({
                where: { id: productId, brandId: ctx.brandId },
                include: { category: true }
            });

            if (!product || product.category.brandId !== ctx.brandId) {
                throw new Error('Product not found or does not belong to brand');
            }

            // 2. Update product
            const updated = await tx.frozenProduct.update({
                where: { id: productId, brandId: ctx.brandId },
                data: {
                    ...(input.name ? { name: input.name } : {}),
                    ...(input.slug ? { slug: input.slug } : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                    ...(input.image !== undefined ? { image: input.image } : {}),
                    ...(input.ingredients !== undefined ? { ingredients: input.ingredients } : {}),
                    ...(input.nutrition !== undefined ? { nutrition: input.nutrition } : {}),
                    ...(input.storageType ? { storageType: input.storageType } : {}),
                    ...(input.shelfLife !== undefined ? { shelfLife: input.shelfLife } : {})
                }
            });

            // 3. Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'PRODUCT_UPDATE',
                    entityType: 'FROZEN_PRODUCT',
                    entityId: productId,
                    metadata: { changes: input }
                }
            });

            return updated;
        });
    }

    /**
     * Get products for brand
     */
    async getProducts(brandId: string, categoryId?: string) {
        return prisma.frozenProduct.findMany({
            where: {
                category: { brandId },
                ...(categoryId ? { categoryId } : {})
            },
            include: {
                category: true,
                variants: {
                    orderBy: { price: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get single product with variants
     */
    async getProduct(productId: string) {
        return prisma.frozenProduct.findUnique({
            where: { id: productId },
            include: {
                category: true,
                variants: {
                    include: {
                        batches: {
                            where: {
                                quantity: { gt: 0 },
                                isExpired: false
                            },
                            orderBy: { expiryDate: 'asc' }
                        }
                    }
                }
            }
        });
    }

    /**
     * Get product by slug (public)
     */
    async getProductBySlug(slug: string) {
        return prisma.frozenProduct.findUnique({
            where: { slug },
            include: {
                category: {
                    include: {
                        brand: {
                            select: {
                                id: true,
                                slug: true,
                                name: true
                            }
                        }
                    }
                },
                variants: {
                    orderBy: { price: 'asc' }
                }
            }
        });
    }

    /**
     * Update variant price
     */
    async updateVariantPrice(
        ctx: ServiceContext,
        variantId: string,
        newPrice: number
    ) {
        return prisma.$transaction(async (tx: any) => {
            const variant = await tx.frozenVariant.findUnique({
                where: { id: variantId, brandId: ctx.brandId },
                include: {
                    product: {
                        include: { category: true }
                    }
                }
            });

            if (!variant || variant.product.category.brandId !== ctx.brandId) {
                throw new Error('Variant not found or does not belong to brand');
            }

            const oldPrice = variant.price;

            const updated = await tx.frozenVariant.update({
                where: { id: variantId, brandId: ctx.brandId },
                data: { price: newPrice }
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'PRICE_UPDATE',
                    entityType: 'FROZEN_VARIANT',
                    entityId: variantId,
                    metadata: {
                        oldPrice: oldPrice.toString(),
                        newPrice: newPrice.toString(),
                        sku: variant.sku
                    }
                }
            });

            return updated;
        });
    }

    /**
     * Get low stock variants
     */
    async getLowStockVariants(brandId: string, threshold: number = 10) {
        return prisma.frozenVariant.findMany({
            where: {
                product: {
                    category: { brandId }
                },
                stockOnHand: { lte: threshold }
            },
            include: {
                product: {
                    select: {
                        name: true,
                        category: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { stockOnHand: 'asc' }
        });
    }

    /**
     * Create category
     */
    async createCategory(
        ctx: ServiceContext,
        data: {
            name: string;
            slug: string;
            image?: string;
        }
    ) {
        return prisma.frozenCategory.create({
            data: {
                brandId: ctx.brandId,
                name: data.name,
                slug: data.slug,
                image: data.image
            }
        });
    }

    /**
     * Get categories for brand
     */
    async getCategories(brandId: string) {
        return prisma.frozenCategory.findMany({
            where: { brandId },
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
}
