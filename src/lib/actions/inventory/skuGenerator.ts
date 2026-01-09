'use server';

import { prisma } from '@/lib/prisma';

/**
 * Generates a standardized SKU for a product variant.
 * Format: [BRAND_SLUG]-[CATEGORY_SLUG]-[VARIANT_NAME_Sub]-[SEQ]
 * Example: RI-FROZEN-RENDANG-005
 */
export async function generateSkuAction(brandId: string, variantId: string) {
    try {
        const variant = await prisma.mockupVariant.findUnique({
            where: { id: variantId },
            include: {
                product: {
                    include: {
                        collection: true,
                        category: true // For Frozen Products
                    }
                }
            }
        });

        if (!variant) throw new Error('Variant not found');

        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { slug: true }
        });

        if (!brand) throw new Error('Brand not found');

        // 1. Determine Brand Prefix (2-3 chars)
        // e.g., 'rasa-ibu' -> 'RI', 'achiera-merch' -> 'AM'
        const brandPrefix = brand.slug
            .split('-')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 3);

        // 2. Determine Category Slug
        // e.g., 'Frozen Food' -> 'FRZ', 'Merchandise' -> 'MRC'
        let catSlug = 'GEN';
        // Check if it's a frozen product (via relation) or regular product
        // Note: The schema for ProductVariant -> Product -> Collection is standard
        // For FrozenVariant, it's FrozenVariant -> Product -> Category

        // Handling both Schema Types (Standard Product vs FrozenVariant)
        // We'll infer from context or checks. The input `variantId` is generic but we need to know which table.
        // Wait, `ProductVariant` vs `FrozenVariant`. The schema has both.
        // Let's assume this action is for `FrozenVariant` first as that's the main inventory item for Rasa Ibu.
        // But the schema check above used `productVariant`. 

        // Let's support both. We'll try finding in `FrozenVariant` if not found in `ProductVariant`.

        // RE-FETCHING to be safe
        let targetVariant: any = variant;
        let isFrozen = false;

        // If the initial fetch returned null (because it might be a FrozenVariant), try FrozenVariant
        if (!variant) {
            const fVariant = await prisma.frozenVariant.findUnique({
                where: { id: variantId },
                include: {
                    product: {
                        include: {
                            category: true
                        }
                    }
                }
            });
            if (fVariant) {
                targetVariant = fVariant;
                isFrozen = true;
            } else {
                // Really not found
                throw new Error('Variant not found');
            }
        } else {
            // It is a regular ProductVariant
            // Regular products belong to `MerchCollection`
            isFrozen = false;
        }

        if (isFrozen) {
            // Use Frozen Category
            const catName = targetVariant.product.category?.name || 'Frozen';
            catSlug = catName.substring(0, 4).toUpperCase().replace(/\s/g, '');
        } else {
            // Use Collection Name
            const colName = targetVariant.product.collection?.name || 'General';
            catSlug = colName.substring(0, 4).toUpperCase().replace(/\s/g, '');
        }

        // 3. Variant Name Slice
        // e.g., "Rendang Sapi" -> "REND"
        const varName = targetVariant.product.name.substring(0, 4).toUpperCase().replace(/\s/g, '');

        // 4. Sequence Number
        // Count how many variants exist with this prefix to determine the next number
        // We can't do exact pattern matching easily in SQL without raw query, so we'll use a random check or just increment
        // A better way is to check the last SKU that starts with this prefix
        const prefix = `${brandPrefix}-${catSlug}-${varName}`;

        // Find existing SKUs matching this prefix
        // We need to query either ProductVariant or FrozenVariant
        const modelDelegate = isFrozen ? prisma.frozenVariant : prisma.productVariant;

        const lastSkuItem = await (modelDelegate as any).findFirst({
            where: {
                sku: {
                    startsWith: prefix
                }
            },
            orderBy: {
                sku: 'desc'
            }
        });

        let seq = 1;
        if (lastSkuItem?.sku) {
            const parts = lastSkuItem.sku.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }

        const newSku = `${prefix}-${seq.toString().padStart(3, '0')}`;

        // 5. Update
        await (modelDelegate as any).update({
            where: { id: variantId },
            data: { sku: newSku }
        });

        return { success: true, sku: newSku };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
