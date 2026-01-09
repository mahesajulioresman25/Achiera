// Rule Demotion - Auto-demote rules on anomaly detection
// Integrated with rule-trust.ts for demotion logic

import { prisma } from '@/lib/prisma';

export interface DemotionResult {
    success: boolean;
    new_level: number;
    reason?: string;
}

/**
 * Auto-demote rule if anomalies detected
 */
export async function autoDemoteRule(
    ruleId: string,
    reason: string,
    performedBy: string
): Promise<DemotionResult> {
    try {
        // Get current rule
        const rule = await prisma.decisionRule.findUnique({
            where: { id: ruleId }
        });

        if (!rule) {
            return {
                success: false,
                new_level: 0,
                reason: 'Rule not found'
            };
        }

        if (rule.autonomyLevel === 0) {
            return {
                success: false,
                new_level: 0,
                reason: 'Already at minimum level'
            };
        }

        const newLevel = Math.max(0, rule.autonomyLevel - 1);

        // Update rule level
        await prisma.decisionRule.update({
            where: { id: ruleId },
            data: {
                autonomyLevel: newLevel,
                lastModifiedAt: new Date(),
                lastModifiedBy: performedBy
            }
        });

        // Log demotion
        await prisma.auditLog.create({
            data: {
                userId: performedBy,
                brandId: rule.brandId,
                action: 'rule_demoted',
                entityType: 'DecisionRule',
                entityId: ruleId,
                metadata: {
                    ruleId,
                    ruleName: rule.name,
                    previousLevel: rule.autonomyLevel,
                    newLevel,
                    reason
                }
            }
        });

        return {
            success: true,
            new_level: newLevel
        };
    } catch (error) {
        console.error('[AUTO DEMOTE] Failed:', error);
        return {
            success: false,
            new_level: 0,
            reason: 'Demotion failed'
        };
    }
}
