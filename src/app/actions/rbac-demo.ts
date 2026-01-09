'use server'

import { auth } from "@/auth";
import { requireAccess } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { BrandRole } from "@prisma/client";

/**
 * Example Action: Create a Product (Protected)
 * Requirements:
 * - Must be Global Admin OR
 * - Must be BRAND_ADMIN for the specific brand
 */
export async function createProductAction(brandSlug: string, formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user) {
            return { error: "Unauthorized" };
        }

        // 🛡️ RBAC CHECK
        // 🛡️ RBAC CHECK
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
            select: { id: true }
        });

        if (!brand) {
            return { error: "Brand not found" };
        }

        await requireAccess(brand.id, ['BRAND_ADMIN', 'BRAND_WAREHOUSE_ADMIN']);

        // Business Logic
        const productName = formData.get('name');
        console.log(`Creating product ${productName} for brand ${brandSlug}`);

        return { success: true, message: "Product created" };

    } catch (error: any) {
        // AccessControlError will be caught here
        console.error("Action Error:", error.message);
        return { error: error.message };
    }
}
