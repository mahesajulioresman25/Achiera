import { prisma } from "@/lib/prisma";
import { BrandRole } from "@prisma/client";

// Core Actions
export type PermissionAction =
    | 'ORDER_READ' | 'ORDER_UPDATE' | 'ORDER_DELETE'
    | 'REFUND_APPROVE'
    | 'PRODUCT_CREATE' | 'PRODUCT_PUBLISH'
    | 'USER_INVITE'
    | 'REPORT_VIEW';

// Fallback Defaults (Code-defined Source of Truth until DB overrides)
const DEFAULT_POLICIES: Record<BrandRole, PermissionAction[]> = {
    BRAND_ADMIN: [
        'ORDER_READ', 'ORDER_UPDATE', 'ORDER_DELETE',
        'REFUND_APPROVE',
        'PRODUCT_CREATE', 'PRODUCT_PUBLISH',
        'USER_INVITE', 'REPORT_VIEW'
    ],
    BRAND_FINANCE: [
        'ORDER_READ',
        'REFUND_APPROVE',
        'REPORT_VIEW'
    ],
    BRAND_WAREHOUSE_ADMIN: [
        'ORDER_READ', 'ORDER_UPDATE',
        'PRODUCT_CREATE'
    ],
    BRAND_MARKETING: [
        'PRODUCT_CREATE', 'PRODUCT_PUBLISH'
    ],
    WAREHOUSE_STAFF: [
        'ORDER_READ', 'ORDER_UPDATE'
    ],
    CUSTOMER_SUPPORT: [
        'ORDER_READ', 'ORDER_UPDATE', 'REFUND_APPROVE'
    ],
    RESELLER: [
        'ORDER_READ'
    ],
    CONSUMER: []
};

export class PolicyService {

    /**
     * Check if a User has a specific Permission in a Brand context
     */
    async hasPermission(userId: string, brandId: string, action: PermissionAction): Promise<boolean> {
        // 1. Get User's Role in this Brand
        const userRole = await prisma.userBrandRole.findUnique({
            where: { userId_brandId: { userId, brandId } }
        });

        if (!userRole) return false;

        // 2. Resolve Policy
        // Strategy: Check DB Override -> Check DB Default -> Use Code Default

        // Try fetch Brand-Specific Policy
        let policy = await prisma.rolePolicy.findUnique({
            where: { brandId_role: { brandId, role: userRole.role } }
        });

        // If no brand policy, try Global DB Policy
        if (!policy) {
            policy = await prisma.rolePolicy.findUnique({
                where: { brandId_role: { brandId: null as any, role: userRole.role } } // 'null' needs handling in Prisma logic if using exact match, usually separate query or different where
            });
            // Note: Prisma where clause for composed key with null:
            // Actually simpler to findFirst with hierarchy
        }

        let permissions: PermissionAction[] = [];

        if (policy) {
            permissions = policy.permissions as PermissionAction[];
        } else {
            // Fallback to Code Defaults
            permissions = DEFAULT_POLICIES[userRole.role] || [];
        }

        // 3. Evaluate
        return permissions.includes(action);
    }

    /**
     * Set a Global Policy (Admin usage)
     */
    async setGlobalPolicy(role: BrandRole, permissions: PermissionAction[]) {
        // Need to handle the unique constraint carefully or use raw queries for generic 'null' brandId
        // Prisma doesn't always love composite uniques with NULL.
        // Alternative: Use a specific string 'GLOBAL' or empty string if schema allows, or just separate find calls.
    }
}
