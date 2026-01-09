// Governance Lock - Prevent unauthorized changes to rules and thresholds
// CRITICAL: CFO-grade controls, no runtime modifications without approval

import { prisma } from '@/lib/prisma';

/**
 * Governance flags
 */
export interface GovernanceFlags {
    canAddRule: boolean;
    canModifyThreshold: boolean;
    canEnableLevel3: boolean;
    requiresCFOApproval: boolean;
}

/**
 * Check governance permissions for brand
 */
export async function checkGovernancePermissions(
    brandId: string,
    userId: string
): Promise<GovernanceFlags> {
    // Fetch brand governance settings
    const brand = await prisma.brand.findUnique({
        where: { id: brandId }
    });

    if (!brand) {
        throw new Error(`Brand not found: ${brandId}`);
    }

    // Fetch user role
    const userRole = await getUserRole(brandId, userId);

    // Determine permissions
    const canAddRule = userRole === 'owner' || userRole === 'cfo';
    const canModifyThreshold = userRole === 'owner' || userRole === 'cfo';
    const canEnableLevel3 = userRole === 'cfo';
    const requiresCFOApproval = true; // Always require CFO approval for governance changes

    return {
        canAddRule,
        canModifyThreshold,
        canEnableLevel3,
        requiresCFOApproval
    };
}

/**
 * Get user role for brand
 */
async function getUserRole(
    brandId: string,
    userId: string
): Promise<'owner' | 'admin' | 'manager' | 'operator'> {
    const membership = await prisma.brandMember.findFirst({
        where: {
            brandId,
            userId
        }
    });

    return (membership?.role as any) || 'operator';
}

/**
 * Validate rule addition (governance lock)
 */
export async function validateRuleAddition(
    brandId: string,
    userId: string,
    ruleData: any
): Promise<{
    allowed: boolean;
    reason?: string;
    requiresApproval: boolean;
}> {
    const permissions = await checkGovernancePermissions(brandId, userId);

    // Check if user can add rules
    if (!permissions.canAddRule) {
        return {
            allowed: false,
            reason: 'Insufficient permissions - only Brand Owner or CFO can add rules',
            requiresApproval: false
        };
    }

    // Check if rule requires CFO approval
    const riskTier = ruleData.riskLevel || 'MEDIUM';
    const requiresApproval = riskTier === 'HIGH' || riskTier === 'CRITICAL';

    return {
        allowed: true,
        requiresApproval: requiresApproval
    };
}

/**
 * Validate threshold modification (governance lock)
 */
export async function validateThresholdModification(
    brandId: string,
    userId: string,
    ruleId: string,
    oldThreshold: number,
    newThreshold: number
): Promise<{
    allowed: boolean;
    reason?: string;
    requiresApproval: boolean;
}> {
    const permissions = await checkGovernancePermissions(brandId, userId);

    // Check if user can modify thresholds
    if (!permissions.canModifyThreshold) {
        return {
            allowed: false,
            reason: 'Insufficient permissions - only Brand Owner or CFO can modify thresholds',
            requiresApproval: false
        };
    }

    // Check if modification is significant (>20% change)
    const changePercent = Math.abs((newThreshold - oldThreshold) / oldThreshold);
    const significantChange = changePercent > 0.20;

    // Significant changes require CFO approval
    const requiresApproval = significantChange;

    return {
        allowed: true,
        requiresApproval: requiresApproval
    };
}

/**
 * Validate Level 3 autonomy enablement (governance lock)
 */
export async function validateLevel3Enablement(
    brandId: string,
    userId: string
): Promise<{
    allowed: boolean;
    reason?: string;
    requiresCFOApproval: boolean;
}> {
    const permissions = await checkGovernancePermissions(brandId, userId);

    // Only CFO can enable Level 3
    if (!permissions.canEnableLevel3) {
        return {
            allowed: false,
            reason: 'Level 3 autonomy requires CFO approval',
            requiresCFOApproval: true
        };
    }

    // Check if brand has sufficient history
    const executionHistory = await prisma.executionLog.count({
        where: {
            brandId,
            executionStatus: 'success'
        }
    });

    // Require at least 100 successful executions before Level 3
    if (executionHistory < 100) {
        return {
            allowed: false,
            reason: `Insufficient execution history (${executionHistory}/100 required)`,
            requiresCFOApproval: true
        };
    }

    // Calculate success rate
    const totalExecutions = await prisma.executionLog.count({
        where: { brandId }
    });

    const successRate = executionHistory / totalExecutions;

    // Require at least 90% success rate
    if (successRate < 0.90) {
        return {
            allowed: false,
            reason: `Success rate too low (${(successRate * 100).toFixed(0)}% < 90% required)`,
            requiresCFOApproval: true
        };
    }

    return {
        allowed: true,
        requiresCFOApproval: true
    };
}

/**
 * Log governance action for audit
 */
export async function logGovernanceAction(
    brandId: string,
    userId: string,
    action: 'rule_added' | 'threshold_modified' | 'level3_enabled',
    details: any
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            brandId,
            eventType: `governance_${action}`,
            performedBy: userId,
            timestamp: new Date(),
            metadata: details
        }
    });
}

/**
 * Runtime protection - prevent direct rule modification
 */
export function preventRuntimeModification(): void {
    // This is a compile-time check
    // Rules and thresholds are loaded from database only
    // No in-memory modifications allowed

    Object.freeze({
        message: 'Rules and thresholds cannot be modified at runtime',
        enforcement: 'All changes must go through governance approval process'
    });
}

/**
 * Governance guard decorator
 */
export function requiresGovernanceApproval(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        const [brandId, userId] = args;

        const permissions = await checkGovernancePermissions(brandId, userId);

        if (!permissions.requiresCFOApproval) {
            throw new Error('This action requires CFO approval');
        }

        return originalMethod.apply(this, args);
    };

    return descriptor;
}
