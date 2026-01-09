// ACHIERA Platform - Role Escalation Prevention
// Prevents unauthorized role changes and privilege escalation

import { prisma } from '@/lib/prisma';
import { BrandRole, GlobalRole } from '@prisma/client';

/**
 * Role hierarchy (lower number = higher privilege)
 */
const ROLE_HIERARCHY: Record<BrandRole, number> = {
    BRAND_ADMIN: 1,
    BRAND_FINANCE: 2,
    BRAND_WAREHOUSE_ADMIN: 2,
    BRAND_MARKETING: 3,
    WAREHOUSE_STAFF: 4,
    CUSTOMER_SUPPORT: 4,
    RESELLER: 5,
    CONSUMER: 6
};

const GLOBAL_ROLE_HIERARCHY: Record<GlobalRole, number> = {
    OWNER: 1,
    PLATFORM_ADMIN: 2,
    PLATFORM_FINANCE: 3,
    PLATFORM_ANALYST: 4,
    USER: 5
};

export class RoleEscalationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RoleEscalationError';
    }
}

/**
 * Validate role assignment (prevent escalation)
 */
export async function validateRoleAssignment(
    assignerId: string,
    targetUserId: string,
    brandId: string,
    newRole: BrandRole
): Promise<void> {
    // Get assigner's role
    const assigner = await prisma.user.findUnique({
        where: { id: assignerId },
        include: {
            brandRoles: {
                where: { brandId }
            }
        }
    });

    if (!assigner) {
        throw new RoleEscalationError('Assigner not found');
    }

    // OWNER bypass
    if (assigner.globalRole === 'OWNER') {
        await logRoleChange(assignerId, targetUserId, brandId, newRole, 'OWNER_BYPASS');
        return;
    }

    // Get assigner's brand role
    const assignerRole = assigner.brandRoles[0]?.role;
    if (!assignerRole) {
        throw new RoleEscalationError('Assigner has no role in this brand');
    }

    // Only BRAND_ADMIN can assign roles
    if (assignerRole !== 'BRAND_ADMIN') {
        throw new RoleEscalationError('Only BRAND_ADMIN can assign roles');
    }

    // Cannot assign role higher than own role
    if (ROLE_HIERARCHY[newRole] <= ROLE_HIERARCHY[assignerRole]) {
        throw new RoleEscalationError('Cannot assign role equal to or higher than your own');
    }

    // Get target user's current role
    const targetRole = await prisma.userBrandRole.findUnique({
        where: {
            userId_brandId: {
                userId: targetUserId,
                brandId
            }
        }
    });

    // Cannot modify users with higher or equal roles
    if (targetRole && ROLE_HIERARCHY[targetRole.role] <= ROLE_HIERARCHY[assignerRole]) {
        throw new RoleEscalationError('Cannot modify users with equal or higher roles');
    }

    // Log the role change
    await logRoleChange(assignerId, targetUserId, brandId, newRole, 'APPROVED');
}

/**
 * Validate global role change (platform-level)
 */
export async function validateGlobalRoleChange(
    assignerId: string,
    targetUserId: string,
    newGlobalRole: GlobalRole
): Promise<void> {
    const assigner = await prisma.user.findUnique({
        where: { id: assignerId }
    });

    if (!assigner) {
        throw new RoleEscalationError('Assigner not found');
    }

    // Only OWNER can change global roles
    if (assigner.globalRole !== 'OWNER') {
        throw new RoleEscalationError('Only OWNER can change global roles');
    }

    // Cannot assign OWNER role (must be done manually in database)
    if (newGlobalRole === 'OWNER') {
        throw new RoleEscalationError('OWNER role cannot be assigned programmatically');
    }

    // Get target user
    const target = await prisma.user.findUnique({
        where: { id: targetUserId }
    });

    if (!target) {
        throw new RoleEscalationError('Target user not found');
    }

    // Cannot modify other OWNERs
    if (target.globalRole === 'OWNER') {
        throw new RoleEscalationError('Cannot modify OWNER users');
    }

    await logGlobalRoleChange(assignerId, targetUserId, newGlobalRole);
}

/**
 * Prevent self-role modification
 */
export async function preventSelfRoleModification(
    userId: string,
    targetUserId: string
): Promise<void> {
    if (userId === targetUserId) {
        throw new RoleEscalationError('Cannot modify your own role');
    }
}

/**
 * Validate permission for sensitive actions
 */
export async function validateSensitiveAction(
    userId: string,
    brandId: string,
    action: string,
    requiredRoles: BrandRole[]
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            brandRoles: {
                where: { brandId }
            }
        }
    });

    if (!user) {
        throw new RoleEscalationError('User not found');
    }

    // OWNER bypass
    if (user.globalRole === 'OWNER') {
        await logSensitiveAction(userId, brandId, action, 'OWNER_BYPASS');
        return;
    }

    const userRole = user.brandRoles[0]?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
        await logSensitiveAction(userId, brandId, action, 'DENIED');
        throw new RoleEscalationError(`Action '${action}' requires one of: ${requiredRoles.join(', ')}`);
    }

    await logSensitiveAction(userId, brandId, action, 'APPROVED');
}

/**
 * Log role changes for audit
 */
async function logRoleChange(
    assignerId: string,
    targetUserId: string,
    brandId: string,
    newRole: BrandRole,
    status: string
) {
    await prisma.auditLog.create({
        data: {
            userId: assignerId,
            brandId,
            action: 'ROLE_CHANGE',
            entityType: 'USER_ROLE',
            entityId: targetUserId,
            metadata: {
                targetUserId,
                newRole,
                status,
                timestamp: new Date().toISOString()
            }
        }
    });
}

/**
 * Log global role changes
 */
async function logGlobalRoleChange(
    assignerId: string,
    targetUserId: string,
    newGlobalRole: GlobalRole
) {
    await prisma.auditLog.create({
        data: {
            userId: assignerId,
            brandId: null,
            action: 'GLOBAL_ROLE_CHANGE',
            entityType: 'USER',
            entityId: targetUserId,
            metadata: {
                targetUserId,
                newGlobalRole,
                timestamp: new Date().toISOString()
            }
        }
    });
}

/**
 * Log sensitive actions
 */
async function logSensitiveAction(
    userId: string,
    brandId: string,
    action: string,
    status: string
) {
    await prisma.auditLog.create({
        data: {
            userId,
            brandId,
            action: `SENSITIVE_${action}`,
            entityType: 'SECURITY',
            entityId: 'SYSTEM',
            metadata: {
                action,
                status,
                timestamp: new Date().toISOString()
            }
        }
    });
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: BrandRole): number {
    return ROLE_HIERARCHY[role];
}

/**
 * Check if role A can manage role B
 */
export function canManageRole(managerRole: BrandRole, targetRole: BrandRole): boolean {
    return ROLE_HIERARCHY[managerRole] < ROLE_HIERARCHY[targetRole];
}
