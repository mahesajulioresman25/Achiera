'use server';

import { AuditService, AuditLogFilters } from '@/lib/services/AuditService';
import { ComplianceService, ViolationFilters } from '@/lib/services/ComplianceService';

const auditService = new AuditService();
const complianceService = new ComplianceService();

// ============================================
// AUDIT ACTIONS
// ============================================

export async function getAuditLogsAction(filters: AuditLogFilters) {
    try {
        const logs = await auditService.getLogs(filters);
        return { success: true, data: JSON.parse(JSON.stringify(logs)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAuditLogsByEntityAction(entityType: string, entityId: string) {
    try {
        const logs = await auditService.getLogsByEntity(entityType, entityId);
        return { success: true, data: JSON.parse(JSON.stringify(logs)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getActivitySummaryAction(brandId: string, days?: number) {
    try {
        const summary = await auditService.getActivitySummary(brandId, days);
        return { success: true, data: JSON.parse(JSON.stringify(summary)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function detectAnomaliesAction(brandId: string, hours?: number) {
    try {
        const anomalies = await auditService.detectAnomalies(brandId, hours);
        return { success: true, data: JSON.parse(JSON.stringify(anomalies)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function exportAuditLogsAction(filters: AuditLogFilters) {
    try {
        const csv = await auditService.exportToCSV(filters);
        return { success: true, data: csv };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAuditStatisticsAction(brandId?: string, days?: number) {
    try {
        const stats = await auditService.getStatistics(brandId, days);
        return { success: true, data: JSON.parse(JSON.stringify(stats)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ============================================
// COMPLIANCE ACTIONS
// ============================================

export async function getComplianceRulesAction(brandId?: string, activeOnly?: boolean) {
    try {
        const rules = await complianceService.getRules(brandId, activeOnly);
        return { success: true, data: JSON.parse(JSON.stringify(rules)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getComplianceViolationsAction(filters: ViolationFilters) {
    try {
        const violations = await complianceService.getViolations(filters);
        return { success: true, data: JSON.parse(JSON.stringify(violations)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function resolveViolationAction(violationId: string, resolvedBy: string, resolution: string) {
    try {
        const violation = await complianceService.resolveViolation(violationId, resolvedBy, resolution);
        return { success: true, data: JSON.parse(JSON.stringify(violation)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function waiveViolationAction(violationId: string, resolvedBy: string, reason: string) {
    try {
        const violation = await complianceService.waiveViolation(violationId, resolvedBy, reason);
        return { success: true, data: JSON.parse(JSON.stringify(violation)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getComplianceScoreAction(brandId: string, days?: number) {
    try {
        const score = await complianceService.getComplianceScore(brandId, days);
        return { success: true, data: JSON.parse(JSON.stringify(score)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getComplianceDashboardAction(brandId?: string) {
    try {
        const dashboard = await complianceService.getComplianceDashboard(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(dashboard)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function initializeDefaultRulesAction(brandId?: string) {
    try {
        const rules = await complianceService.initializeDefaultRules(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(rules)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
