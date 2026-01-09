import { prisma } from '@/lib/prisma';
import { ComplianceCategory, RuleType, ComplianceSeverity, ViolationStatus } from '@prisma/client';

export interface ComplianceRuleInput {
    name: string;
    description: string;
    category: ComplianceCategory;
    ruleType: RuleType;
    conditions: any; // JSON rule logic
    severity: ComplianceSeverity;
    brandId?: string; // null = applies to all brands
}

export interface ViolationInput {
    ruleId: string;
    brandId?: string;
    userId?: string;
    entityType: string;
    entityId: string;
    description: string;
    severity: ComplianceSeverity;
}

export interface ViolationFilters {
    brandId?: string;
    userId?: string;
    ruleId?: string;
    status?: ViolationStatus;
    severity?: ComplianceSeverity;
    startDate?: Date;
    endDate?: Date;
}

export interface ComplianceDashboard {
    overallScore: number; // 0-100
    totalRules: number;
    activeRules: number;
    totalViolations: number;
    openViolations: number;
    criticalViolations: number;
    violationsByCategory: Record<string, number>;
    recentViolations: any[];
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export class ComplianceService {
    /**
     * Create a new compliance rule
     */
    async createRule(input: ComplianceRuleInput) {
        return await prisma.complianceRule.create({
            data: {
                name: input.name,
                description: input.description,
                category: input.category,
                ruleType: input.ruleType,
                conditions: input.conditions,
                severity: input.severity,
                brandId: input.brandId,
                isActive: true
            }
        });
    }

    /**
     * Get all rules (optionally filtered by brand)
     */
    async getRules(brandId?: string, activeOnly: boolean = true) {
        const where: any = {};

        if (brandId) {
            where.OR = [
                { brandId },
                { brandId: null } // Global rules
            ];
        }

        if (activeOnly) {
            where.isActive = true;
        }

        return await prisma.complianceRule.findMany({
            where,
            include: {
                brand: {
                    select: { id: true, name: true }
                },
                violations: {
                    where: { status: 'OPEN' },
                    take: 5
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Evaluate a rule against context
     */
    async evaluateRule(ruleId: string, context: any): Promise<boolean> {
        const rule = await prisma.complianceRule.findUnique({
            where: { id: ruleId }
        });

        if (!rule || !rule.isActive) {
            return true; // Pass if rule doesn't exist or is inactive
        }

        const conditions = rule.conditions as any;

        // Evaluate based on rule type
        switch (rule.ruleType) {
            case 'THRESHOLD':
                return this.evaluateThreshold(conditions, context);

            case 'MANDATORY_FIELD':
                return this.evaluateMandatoryField(conditions, context);

            case 'WORKFLOW':
                return this.evaluateWorkflow(conditions, context);

            case 'TIMING':
                return this.evaluateTiming(conditions, context);

            case 'SEGREGATION':
                return this.evaluateSegregation(conditions, context);

            case 'LIMIT':
                return this.evaluateLimit(conditions, context);

            default:
                return true;
        }
    }

    /**
     * Record a compliance violation
     */
    async recordViolation(input: ViolationInput) {
        return await prisma.complianceViolation.create({
            data: {
                ruleId: input.ruleId,
                brandId: input.brandId,
                userId: input.userId,
                entityType: input.entityType,
                entityId: input.entityId,
                description: input.description,
                severity: input.severity,
                status: 'OPEN'
            },
            include: {
                rule: true,
                brand: true,
                user: true
            }
        });
    }

    /**
     * Get violations with filters
     */
    async getViolations(filters: ViolationFilters = {}) {
        const where: any = {};

        if (filters.brandId) where.brandId = filters.brandId;
        if (filters.userId) where.userId = filters.userId;
        if (filters.ruleId) where.ruleId = filters.ruleId;
        if (filters.status) where.status = filters.status;
        if (filters.severity) where.severity = filters.severity;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        return await prisma.complianceViolation.findMany({
            where,
            include: {
                rule: true,
                brand: {
                    select: { id: true, name: true }
                },
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Resolve a violation
     */
    async resolveViolation(violationId: string, resolvedBy: string, resolution: string) {
        return await prisma.complianceViolation.update({
            where: { id: violationId },
            data: {
                status: 'RESOLVED',
                resolvedBy,
                resolvedAt: new Date(),
                resolution
            }
        });
    }

    /**
     * Waive a violation
     */
    async waiveViolation(violationId: string, resolvedBy: string, reason: string) {
        return await prisma.complianceViolation.update({
            where: { id: violationId },
            data: {
                status: 'WAIVED',
                resolvedBy,
                resolvedAt: new Date(),
                resolution: `WAIVED: ${reason}`
            }
        });
    }

    /**
     * Calculate compliance score for a brand
     */
    async getComplianceScore(brandId: string, days: number = 30): Promise<number> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get total applicable rules
        const totalRules = await prisma.complianceRule.count({
            where: {
                isActive: true,
                OR: [
                    { brandId },
                    { brandId: null }
                ]
            }
        });

        if (totalRules === 0) return 100;

        // Get violations in period
        const violations = await prisma.complianceViolation.count({
            where: {
                brandId,
                createdAt: { gte: startDate },
                status: { in: ['OPEN', 'INVESTIGATING'] }
            }
        });

        // Score calculation: 100 - (violations / rules * weight)
        // Weight violations by severity
        const violationsBySeverity = await prisma.complianceViolation.groupBy({
            by: ['severity'],
            where: {
                brandId,
                createdAt: { gte: startDate },
                status: { in: ['OPEN', 'INVESTIGATING'] }
            },
            _count: true
        });

        let weightedViolations = 0;
        violationsBySeverity.forEach(v => {
            const weight = v.severity === 'CRITICAL' ? 10 :
                v.severity === 'HIGH' ? 5 :
                    v.severity === 'MEDIUM' ? 2 : 1;
            weightedViolations += v._count * weight;
        });

        const score = Math.max(0, 100 - (weightedViolations / totalRules * 10));
        return Math.round(score);
    }

    /**
     * Get compliance dashboard data
     */
    async getComplianceDashboard(brandId?: string): Promise<ComplianceDashboard> {
        const where: any = {};
        if (brandId) {
            where.OR = [
                { brandId },
                { brandId: null }
            ];
        }

        const [totalRules, activeRules, violations] = await Promise.all([
            prisma.complianceRule.count({ where }),
            prisma.complianceRule.count({ where: { ...where, isActive: true } }),
            prisma.complianceViolation.findMany({
                where: brandId ? { brandId } : {},
                include: {
                    rule: {
                        select: { category: true }
                    }
                }
            })
        ]);

        const openViolations = violations.filter(v => v.status === 'OPEN' || v.status === 'INVESTIGATING').length;
        const criticalViolations = violations.filter(v => v.severity === 'CRITICAL' && v.status === 'OPEN').length;

        // Group by category
        const violationsByCategory: Record<string, number> = {};
        violations.forEach(v => {
            const category = v.rule.category;
            violationsByCategory[category] = (violationsByCategory[category] || 0) + 1;
        });

        // Recent violations
        const recentViolations = violations
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10);

        // Calculate trend (compare last 7 days vs previous 7 days)
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const recentCount = violations.filter(v => v.createdAt >= last7Days).length;
        const previousCount = violations.filter(v => v.createdAt >= prev7Days && v.createdAt < last7Days).length;

        let trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
        if (recentCount < previousCount * 0.8) trend = 'IMPROVING';
        else if (recentCount > previousCount * 1.2) trend = 'DECLINING';
        else trend = 'STABLE';

        const overallScore = brandId ? await this.getComplianceScore(brandId) : 100;

        return {
            overallScore,
            totalRules,
            activeRules,
            totalViolations: violations.length,
            openViolations,
            criticalViolations,
            violationsByCategory,
            recentViolations,
            trend
        };
    }

    /**
     * Initialize default compliance rules
     */
    async initializeDefaultRules(brandId?: string) {
        const defaultRules: ComplianceRuleInput[] = [
            {
                name: 'Approval Threshold - High Value Expenses',
                description: 'Expenses over Rp 5,000,000 require manager approval',
                category: 'APPROVAL_WORKFLOW',
                ruleType: 'THRESHOLD',
                conditions: {
                    field: 'amount',
                    operator: '>',
                    value: 5000000,
                    requiresApproval: true
                },
                severity: 'HIGH',
                brandId
            },
            {
                name: 'Segregation of Duties - IC Transactions',
                description: 'Creator and approver must be different people for IC transactions',
                category: 'APPROVAL_WORKFLOW',
                ruleType: 'SEGREGATION',
                conditions: {
                    entityType: 'ICTransaction',
                    creatorField: 'createdBy',
                    approverField: 'approvedBy',
                    mustDiffer: true
                },
                severity: 'CRITICAL',
                brandId
            },
            {
                name: 'Budget Compliance - Expense Limit',
                description: 'Actual expenses cannot exceed budget by more than 20%',
                category: 'FINANCIAL_POLICY',
                ruleType: 'THRESHOLD',
                conditions: {
                    field: 'expenseVariance',
                    operator: '<=',
                    value: 20,
                    unit: 'percent'
                },
                severity: 'HIGH',
                brandId
            },
            {
                name: 'Timely Month-End Close',
                description: 'Month-end journal entries must be posted by 5th of next month',
                category: 'OPERATIONAL',
                ruleType: 'TIMING',
                conditions: {
                    entityType: 'JournalEntry',
                    deadline: 5,
                    deadlineType: 'dayOfMonth'
                },
                severity: 'MEDIUM',
                brandId
            },
            {
                name: 'Invoice Documentation',
                description: 'All invoices over Rp 1,000,000 must have supporting documents',
                category: 'DATA_INTEGRITY',
                ruleType: 'MANDATORY_FIELD',
                conditions: {
                    entityType: 'Invoice',
                    amountThreshold: 1000000,
                    requiredField: 'attachments',
                    minCount: 1
                },
                severity: 'MEDIUM',
                brandId
            }
        ];

        const created = [];
        for (const rule of defaultRules) {
            try {
                const existing = await prisma.complianceRule.findFirst({
                    where: {
                        name: rule.name,
                        brandId: rule.brandId
                    }
                });

                if (!existing) {
                    const newRule = await this.createRule(rule);
                    created.push(newRule);
                }
            } catch (error) {
                console.error(`Failed to create rule: ${rule.name}`, error);
            }
        }

        return created;
    }

    // Private evaluation methods
    private evaluateThreshold(conditions: any, context: any): boolean {
        const value = context[conditions.field];
        const threshold = conditions.value;

        switch (conditions.operator) {
            case '>': return value <= threshold;
            case '>=': return value < threshold;
            case '<': return value >= threshold;
            case '<=': return value > threshold;
            case '==': return value === threshold;
            default: return true;
        }
    }

    private evaluateMandatoryField(conditions: any, context: any): boolean {
        const field = context[conditions.requiredField];
        if (conditions.minCount) {
            return Array.isArray(field) && field.length >= conditions.minCount;
        }
        return field !== null && field !== undefined && field !== '';
    }

    private evaluateWorkflow(conditions: any, context: any): boolean {
        // Check if required approvals are in place
        if (conditions.requiresApproval) {
            return context.approvedBy !== null && context.approvedBy !== undefined;
        }
        return true;
    }

    private evaluateTiming(conditions: any, context: any): boolean {
        const now = new Date();
        const deadline = new Date(now.getFullYear(), now.getMonth(), conditions.deadline);
        return context.createdAt <= deadline;
    }

    private evaluateSegregation(conditions: any, context: any): boolean {
        if (conditions.mustDiffer) {
            const creator = context[conditions.creatorField];
            const approver = context[conditions.approverField];
            return creator !== approver;
        }
        return true;
    }

    private evaluateLimit(conditions: any, context: any): boolean {
        const count = context[conditions.countField] || 0;
        return count < conditions.maxCount;
    }
}
