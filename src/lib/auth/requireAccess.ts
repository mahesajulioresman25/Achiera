// ACHIERA Platform - RBAC Enforcement Middleware
// Server-side permission checks with brand isolation

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export class AccessDeniedError extends Error {
    constructor(
        message: string,
        public readonly userId: string,
        public readonly resource: string,
        public readonly action: string,
        public readonly brandId?: string
    ) {
        super(message);
        this.name = 'AccessDeniedError';
    }
}

export type Permission =
    | 'order:create' | 'order:read' | 'order:update' | 'order:delete'
    | 'product:create' | 'product:read' | 'product:update' | 'product:delete'
    | 'warehouse:create' | 'warehouse:read' | 'warehouse:update' | 'warehouse:delete'
    | 'finance:read' | 'finance:approve' | 'finance:adjust'
    | 'refund:create' | 'refund:approve'
    | 'user:create' | 'user:read' | 'user:update' | 'user:delete'
    | 'brand:create' | 'brand:read' | 'brand:update' | 'brand:delete'
    | 'report:read' | 'report:export'
    | 'settings:read' | 'settings:update';

export type UserRole =
    | 'PLATFORM_OWNER'
    | 'PLATFORM_ADMIN'
    | 'BRAND_OWNER'
    | 'BRAND_ADMIN'
    | 'BRAND_FINANCE'
    | 'BRAND_WAREHOUSE'
    | 'BRAND_SALES';

interface AccessContext {
    userId: string;
    role: UserRole;
    brandId?: string;
    permissions: Permission[];
}

interface RequireAccessOptions {
    permission: Permission;
    brandId?: string;
    allowPlatformOwner?: boolean;
}

/**
 * Role-Permission Matrix
 * Defines what each role can do
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    PLATFORM_OWNER: [
        // Platform owners have ALL permissions across ALL brands
        'order:create', 'order:read', 'order:update', 'order:delete',
        'product:create', 'product:read', 'product:update', 'product:delete',
        'warehouse:create', 'warehouse:read', 'warehouse:update', 'warehouse:delete',
        'finance:read', 'finance:approve', 'finance:adjust',
        'refund:create', 'refund:approve',
        'user:create', 'user:read', 'user:update', 'user:delete',
        'brand:create', 'brand:read', 'brand:update', 'brand:delete',
        'report:read', 'report:export',
        'settings:read', 'settings:update'
    ],
    PLATFORM_ADMIN: [
        'order:read', 'order:update',
        'product:read', 'product:update',
        'warehouse:read',
        'finance:read',
        'user:read', 'user:update',
        'brand:read',
        'report:read', 'report:export'
    ],
    BRAND_OWNER: [
        'order:create', 'order:read', 'order:update', 'order:delete',
        'product:create', 'product:read', 'product:update', 'product:delete',
        'warehouse:create', 'warehouse:read', 'warehouse:update', 'warehouse:delete',
        'finance:read', 'finance:approve', 'finance:adjust',
        'refund:create', 'refund:approve',
        'user:create', 'user:read', 'user:update', 'user:delete',
        'report:read', 'report:export',
        'settings:read', 'settings:update'
    ],
    BRAND_ADMIN: [
        'order:create', 'order:read', 'order:update',
        'product:create', 'product:read', 'product:update',
        'warehouse:read', 'warehouse:update',
        'finance:read',
        'refund:create',
        'user:read',
        'report:read'
    ],
    BRAND_FINANCE: [
        'order:read',
        'finance:read', 'finance:approve',
        'refund:create', 'refund:approve',
        'report:read', 'report:export'
    ],
    BRAND_WAREHOUSE: [
        'order:read',
        'product:read',
        'warehouse:create', 'warehouse:read', 'warehouse:update'
    ],
    BRAND_SALES: [
        'order:create', 'order:read',
        'product:read',
        'report:read'
    ]
};

/**
 * Get user's access context from session
 */
export async function getUserAccessContext(userId: string): Promise<AccessContext> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            globalRole: true,
            brandRoles: {
                select: {
                    brandId: true,
                    role: true
                }
            }
        }
    });

    if (!user) {
        throw new Error(`User ${userId} not found`);
    }

    const role = user.globalRole as UserRole;
    const permissions = ROLE_PERMISSIONS[role] || [];

    // For single-brand context, typically we look at the first brand role or logic specific to the request
    // This part wraps the UserBrandRole into a simpler context for now, or we just rely on the global role + checking brandRoles in 'hasBrandAccess'
    const primaryBrandId = user.brandRoles.length > 0 ? user.brandRoles[0].brandId : undefined;

    return {
        userId: user.id,
        role,
        brandId: primaryBrandId, // Placeholder, needs smarter selection based on request context if multi-brand
        permissions,
        // Enhanced context could include all brand roles
    };
}

/**
 * Check if user has permission
 */
function hasPermission(context: AccessContext, permission: Permission): boolean {
    return context.permissions.includes(permission);
}

/**
 * Check if user has access to specific brand
 */
function hasBrandAccess(context: AccessContext, brandId: string): boolean {
    // Platform owners have access to all brands
    if (context.role === 'PLATFORM_OWNER') {
        return true;
    }

    // Platform admins have read access to all brands
    if (context.role === 'PLATFORM_ADMIN') {
        return true;
    }

    // Brand users can only access their own brand
    return context.brandId === brandId;
}

/**
 * Require access - throws if denied
 */
export async function requireAccess(
    userId: string,
    options: RequireAccessOptions
): Promise<AccessContext> {
    const context = await getUserAccessContext(userId);

    // Check permission
    if (!hasPermission(context, options.permission)) {
        throw new AccessDeniedError(
            `Permission denied: ${options.permission}`,
            userId,
            options.permission.split(':')[0],
            options.permission.split(':')[1],
            options.brandId
        );
    }

    // Check brand access if brandId specified
    if (options.brandId && !hasBrandAccess(context, options.brandId)) {
        throw new AccessDeniedError(
            `Brand access denied: ${options.brandId}`,
            userId,
            'brand',
            'access',
            options.brandId
        );
    }

    return context;
}

/**
 * Extract user ID from request (session/JWT)
 */
import { getToken } from 'next-auth/jwt';

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    return token?.sub || null;
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(
    handler: (request: NextRequest, context: AccessContext) => Promise<Response>,
    options: RequireAccessOptions
) {
    return async (request: NextRequest): Promise<Response> => {
        try {
            // Get user ID from request
            const userId = await getUserIdFromRequest(request);
            if (!userId) {
                return Response.json(
                    { error: 'Unauthorized', message: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Check access
            const context = await requireAccess(userId, options);

            // Execute handler
            return await handler(request, context);

        } catch (error) {
            if (error instanceof AccessDeniedError) {
                return Response.json(
                    {
                        error: 'Forbidden',
                        message: error.message,
                        details: {
                            userId: error.userId,
                            resource: error.resource,
                            action: error.action,
                            brandId: error.brandId
                        }
                    },
                    { status: 403 }
                );
            }

            return Response.json(
                { error: 'Internal Server Error', message: (error as Error).message },
                { status: 500 }
            );
        }
    };
}

/**
 * Check multiple permissions (OR logic)
 */
export async function requireAnyPermission(
    userId: string,
    permissions: Permission[],
    brandId?: string
): Promise<AccessContext> {
    const context = await getUserAccessContext(userId);

    const hasAny = permissions.some(p => hasPermission(context, p));
    if (!hasAny) {
        throw new AccessDeniedError(
            `Permission denied: requires one of ${permissions.join(', ')}`,
            userId,
            'multiple',
            'any',
            brandId
        );
    }

    if (brandId && !hasBrandAccess(context, brandId)) {
        throw new AccessDeniedError(
            `Brand access denied: ${brandId}`,
            userId,
            'brand',
            'access',
            brandId
        );
    }

    return context;
}

/**
 * Check multiple permissions (AND logic)
 */
export async function requireAllPermissions(
    userId: string,
    permissions: Permission[],
    brandId?: string
): Promise<AccessContext> {
    const context = await getUserAccessContext(userId);

    const hasAll = permissions.every(p => hasPermission(context, p));
    if (!hasAll) {
        throw new AccessDeniedError(
            `Permission denied: requires all of ${permissions.join(', ')}`,
            userId,
            'multiple',
            'all',
            brandId
        );
    }

    if (brandId && !hasBrandAccess(context, brandId)) {
        throw new AccessDeniedError(
            `Brand access denied: ${brandId}`,
            userId,
            'brand',
            'access',
            brandId
        );
    }

    return context;
}
