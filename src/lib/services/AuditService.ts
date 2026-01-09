import { prisma } from '@/lib/prisma';
import { AuditAction, AuditSeverity } from '@prisma/client';

export interface AuditLogParams {
    userId: string;
    userName: string;
    userRole: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    brandId?: string;
    changes?: {
        before?: any;
        after?: any;
    };
    metadata?: any;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditLogFilters {
    userId?: string;
    brandId?: string;
    action?: AuditAction;
    entityType?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

export interface ActivitySummary {
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
    recentCritical: any[];
}

export interface Anomaly {
    type: 'UNUSUAL_AMOUNT' | 'OFF_HOURS' | 'RAPID_FIRE' | 'PRIVILEGE_ESCALATION' | 'FAILED_LOGIN';
    description: string;
    severity: AuditSeverity;
    userId?: string;
    brandId?: string;
    metadata: any;
    detectedAt: Date;
}

export class AuditService {
    /**
     * Log an audit event
     */
    async log(params: AuditLogParams): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    userName: params.userName,
                    userRole: params.userRole,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    brandId: params.brandId,
                    changes: params.changes || null,
                    metadata: params.metadata || null,
                    severity: params.severity || 'INFO',
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw - audit logging should never break the main flow
        }
    }

    /**
     * Get audit logs with filters
     */
    async getLogs(filters: AuditLogFilters = {}) {
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.brandId) where.brandId = filters.brandId;
        if (filters.action) where.action = filters.action;
        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.severity) where.severity = filters.severity;

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) where.timestamp.gte = filters.startDate;
            if (filters.endDate) where.timestamp.lte = filters.endDate;
        }

        return await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                brand: {
                    select: { id: true, name: true, slug: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: filters.limit || 100
        });
    }

    /**
     * Get logs for a specific entity
     */
    async getLogsByEntity(entityType: string, entityId: string) {
        return await prisma.auditLog.findMany({
            where: {
                entityType,
                entityId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
    }

    /**
     * Get logs for a specific user
     */
    async getLogsByUser(userId: string, startDate?: Date, endDate?: Date) {
        const where: any = { userId };

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = startDate;
            if (endDate) where.timestamp.lte = endDate;
        }

        return await prisma.auditLog.findMany({
            where,
            include: {
                brand: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
    }

    /**
     * Get activity summary for a brand
     */
    async getActivitySummary(brandId: string, days: number = 30): Promise<ActivitySummary> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await prisma.auditLog.findMany({
            where: {
                brandId,
                timestamp: { gte: startDate }
            },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });

        // Count by action type
        const actionsByType: Record<string, number> = {};
        logs.forEach(log => {
            actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
        });

        // Count by severity
        const actionsBySeverity: Record<string, number> = {};
        logs.forEach(log => {
            actionsBySeverity[log.severity] = (actionsBySeverity[log.severity] || 0) + 1;
        });

        // Top users
        const userCounts: Record<string, { name: string; count: number }> = {};
        logs.forEach(log => {
            if (!userCounts[log.userId]) {
                userCounts[log.userId] = { name: log.userName, count: 0 };
            }
            userCounts[log.userId].count++;
        });

        const topUsers = Object.entries(userCounts)
            .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Recent critical events
        const recentCritical = logs
            .filter(log => log.severity === 'CRITICAL' || log.severity === 'SECURITY')
            .slice(0, 10);

        return {
            totalActions: logs.length,
            actionsByType,
            actionsBySeverity,
            topUsers,
            recentCritical
        };
    }

    /**
     * Detect anomalies in audit logs
     */
    async detectAnomalies(brandId: string, hours: number = 24): Promise<Anomaly[]> {
        const anomalies: Anomaly[] = [];
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const logs = await prisma.auditLog.findMany({
            where: {
                brandId,
                timestamp: { gte: startTime }
            },
            orderBy: { timestamp: 'desc' }
        });

        // 1. Detect off-hours activity (10 PM - 6 AM)
        const offHoursLogs = logs.filter(log => {
            const hour = log.timestamp.getHours();
            return hour >= 22 || hour < 6;
        });

        if (offHoursLogs.length > 5) {
            anomalies.push({
                type: 'OFF_HOURS',
                description: `${offHoursLogs.length} actions detected during off-hours (10 PM - 6 AM)`,
                severity: 'WARNING',
                brandId,
                metadata: { count: offHoursLogs.length, actions: offHoursLogs.slice(0, 5) },
                detectedAt: new Date()
            });
        }

        // 2. Detect rapid-fire actions (>10 actions in 1 minute)
        const userActionTimestamps: Record<string, Date[]> = {};
        logs.forEach(log => {
            if (!userActionTimestamps[log.userId]) {
                userActionTimestamps[log.userId] = [];
            }
            userActionTimestamps[log.userId].push(log.timestamp);
        });

        Object.entries(userActionTimestamps).forEach(([userId, timestamps]) => {
            timestamps.sort((a, b) => a.getTime() - b.getTime());
            for (let i = 0; i < timestamps.length - 10; i++) {
                const timeWindow = timestamps[i + 9].getTime() - timestamps[i].getTime();
                if (timeWindow < 60000) { // 1 minute
                    anomalies.push({
                        type: 'RAPID_FIRE',
                        description: `User performed 10+ actions in 1 minute`,
                        severity: 'WARNING',
                        userId,
                        brandId,
                        metadata: { timeWindow, actionCount: 10 },
                        detectedAt: new Date()
                    });
                    break;
                }
            }
        });

        // 3. Detect failed login patterns (if we track login attempts)
        const failedLogins = logs.filter(log =>
            log.action === 'USER_LOGIN' && log.metadata?.success === false
        );

        const failedLoginsByUser: Record<string, number> = {};
        failedLogins.forEach(log => {
            failedLoginsByUser[log.userId] = (failedLoginsByUser[log.userId] || 0) + 1;
        });

        Object.entries(failedLoginsByUser).forEach(([userId, count]) => {
            if (count >= 3) {
                anomalies.push({
                    type: 'FAILED_LOGIN',
                    description: `${count} failed login attempts detected`,
                    severity: 'SECURITY',
                    userId,
                    brandId,
                    metadata: { attemptCount: count },
                    detectedAt: new Date()
                });
            }
        });

        return anomalies;
    }

    /**
     * Export audit logs to CSV
     */
    async exportToCSV(filters: AuditLogFilters = {}): Promise<string> {
        const logs = await this.getLogs(filters);

        const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Brand', 'Severity', 'IP Address'];
        const rows = logs.map(log => [
            log.timestamp.toISOString(),
            log.userName,
            log.action,
            log.entityType,
            log.entityId,
            log.brand?.name || 'N/A',
            log.severity,
            log.ipAddress || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Get audit statistics
     */
    async getStatistics(brandId?: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const where: any = {
            timestamp: { gte: startDate }
        };

        if (brandId) {
            where.brandId = brandId;
        }

        const [total, bySeverity, byAction] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.groupBy({
                by: ['severity'],
                where,
                _count: true
            }),
            prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: true,
                orderBy: { _count: { action: 'desc' } },
                take: 10
            })
        ]);

        return {
            total,
            bySeverity: bySeverity.reduce((acc, item) => {
                acc[item.severity] = item._count;
                return acc;
            }, {} as Record<string, number>),
            topActions: byAction.map(item => ({
                action: item.action,
                count: item._count
            }))
        };
    }
}
