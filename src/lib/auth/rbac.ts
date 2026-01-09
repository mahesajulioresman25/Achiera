// ACHIERA Platform - RBAC Helper
// Role-Based Access Control utilities

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BrandRole, GlobalRole } from '@prisma/client';

export class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message = 'Not authenticated') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Require user to be authenticated
 * Throws AuthenticationError if not logged in
 */
export async function requireAuth() {
    const session = await auth();
    if (!session) {
        throw new AuthenticationError();
    }
    return session;
}

/**
 * Require user to have specific brand role
 * OWNER bypasses all checks (logged for audit)
 */
export async function requireAccess(
    brandId: string,
    allowedRoles: BrandRole[]
) {
    const session = await requireAuth();

    // OWNER bypass
    if (session.user.globalRole === 'OWNER') {
        // Log for audit
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                brandId,
                action: 'OWNER_ACCESS',
                entityType: 'BRAND',
                entityId: brandId,
                metadata: { allowedRoles }
            }
        }).catch(err => {
            console.error('Failed to log OWNER access:', err);
        });

        return session;
    }

    // Check brand-specific role
    const brandAccess = session.user.brands?.find(b => b.brandId === brandId);

    if (!brandAccess) {
        throw new AuthorizationError('No access to this brand');
    }

    if (!allowedRoles.includes(brandAccess.role)) {
        throw new AuthorizationError(
            `Insufficient permissions. Required: ${allowedRoles.join(', ')}`
        );
    }

    return session;
}

/**
 * Check if user can access brand (boolean, no throw)
 */
export async function canAccessBrand(brandId: string): Promise<boolean> {
    try {
        const session = await auth();
        if (!session) return false;

        if (session.user.globalRole === 'OWNER') return true;

        return session.user.brands?.some(b => b.brandId === brandId) ?? false;
    } catch {
        return false;
    }
}

/**
 * Require global role (platform-level access)
 */
export async function requireGlobalRole(allowedRoles: GlobalRole[]) {
    const session = await requireAuth();

    if (!allowedRoles.includes(session.user.globalRole)) {
        throw new AuthorizationError(
            `Insufficient global permissions. Required: ${allowedRoles.join(', ')}`
        );
    }

    return session;
}

/**
 * Get user's role in specific brand
 */
export async function getUserBrandRole(
    userId: string,
    brandId: string
): Promise<BrandRole | null> {
    const role = await prisma.userBrandRole.findUnique({
        where: {
            userId_brandId: { userId, brandId }
        }
    });

    return role?.role ?? null;
}

/**
 * Check if user has any of the specified roles in brand
 */
export async function hasAnyRole(
    userId: string,
    brandId: string,
    roles: BrandRole[]
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { globalRole: true }
    });

    if (user?.globalRole === 'OWNER') return true;

    const userRole = await getUserBrandRole(userId, brandId);
    return userRole ? roles.includes(userRole) : false;
}

/**
 * Get all brands user has access to
 */
export async function getUserBrands(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            brandRoles: {
                include: {
                    brand: {
                        select: {
                            id: true,
                            slug: true,
                            name: true,
                            logo: true
                        }
                    }
                }
            }
        }
    });

    if (!user) return [];

    // OWNER sees all brands
    if (user.globalRole === 'OWNER') {
        const allBrands = await prisma.brand.findMany({
            where: { isActive: true },
            select: {
                id: true,
                slug: true,
                name: true,
                logo: true
            }
        });

        return allBrands.map(brand => ({
            ...brand,
            role: 'BRAND_ADMIN' as BrandRole // OWNER has implicit admin
        }));
    }

    return user.brandRoles.map(br => ({
        ...br.brand,
        role: br.role
    }));
}

/**
 * Resolve brand by slug and verify access
 */
export async function resolveBrand(brandSlug: string) {
    const session = await requireAuth();

    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug, isActive: true }
    });

    if (!brand) {
        throw new Error('Brand not found');
    }

    // OWNER bypass
    if (session.user.globalRole === 'OWNER') {
        return brand;
    }

    // Check access
    const hasAccess = session.user.brands?.some(b => b.brandId === brand.id);
    if (!hasAccess) {
        throw new AuthorizationError('No access to this brand');
    }

    return brand;
}
