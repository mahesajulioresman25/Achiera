// ACHIERA Platform - Security Audit Service
// Comprehensive security event logging and monitoring

import { prisma } from '@/lib/prisma';

export type SecurityEventType =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'PASSWORD_CHANGE'
    | 'ROLE_CHANGE'
    | 'UNAUTHORIZED_ACCESS'
    | 'CSRF_ATTEMPT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_ACTIVITY'
    | 'DATA_EXPORT'
    | 'SENSITIVE_DATA_ACCESS'
    | 'PERMISSION_DENIED'
    | 'API_ERROR';

export type SecurityEvent = {
    type: SecurityEventType;
    userId?: string;
    brandId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
};

export class SecurityAuditService {
    /**
     * Log security event
     */
    async logEvent(event: SecurityEvent): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: event.userId || null,
                    brandId: event.brandId || null,
                    action: `SECURITY_${event.type}`,
                    entityType: 'SECURITY',
                    entityId: 'SYSTEM',
                    metadata: {
                        ...event.metadata,
                        ip: event.ip,
                        userAgent: event.userAgent,
                        timestamp: new Date().toISOString()
                    }
                }
            });

            // Check for suspicious patterns
            await this.detectSuspiciousActivity(event);

        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    /**
     * Log login attempt
     */
    async logLogin(
        email: string,
        success: boolean,
        ip: string,
        userAgent?: string
    ): Promise<void> {
        await this.logEvent({
            type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
            ip,
            userAgent,
            metadata: { email }
        });

        // Check for brute force
        if (!success) {
            await this.checkBruteForce(email, ip);
        }
    }

    /**
     * Log sensitive data access
     */
    async logSensitiveAccess(
        userId: string,
        brandId: string,
        dataType: string,
        entityId: string
    ): Promise<void> {
        await this.logEvent({
            type: 'SENSITIVE_DATA_ACCESS',
            userId,
            brandId,
            metadata: {
                dataType,
                entityId
            }
        });
    }

    /**
     * Log data export
     */
    async logDataExport(
        userId: string,
        brandId: string,
        exportType: string,
        recordCount: number
    ): Promise<void> {
        await this.logEvent({
            type: 'DATA_EXPORT',
            userId,
            brandId,
            metadata: {
                exportType,
                recordCount
            }
        });
    }

    /**
     * Detect brute force attempts
     */
    private async checkBruteForce(email: string, ip: string): Promise<void> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const recentFailures = await prisma.auditLog.count({
            where: {
                action: 'SECURITY_LOGIN_FAILURE',
                metadata: {
                    path: ['email'],
                    equals: email
                },
                createdAt: {
                    gte: fiveMinutesAgo
                }
            }
        });

        if (recentFailures >= 5) {
            await this.logEvent({
                type: 'SUSPICIOUS_ACTIVITY',
                ip,
                metadata: {
                    reason: 'BRUTE_FORCE_DETECTED',
                    email,
                    failureCount: recentFailures
                }
            });

            // TODO: Implement account lockout or IP blocking
        }
    }

    /**
     * Detect suspicious activity patterns
     */
    private async detectSuspiciousActivity(event: SecurityEvent): Promise<void> {
        if (!event.userId) return;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Check for rapid role changes
        if (event.type === 'ROLE_CHANGE') {
            const recentRoleChanges = await prisma.auditLog.count({
                where: {
                    userId: event.userId,
                    action: 'SECURITY_ROLE_CHANGE',
                    createdAt: {
                        gte: oneHourAgo
                    }
                }
            });

            if (recentRoleChanges >= 3) {
                await this.logEvent({
                    type: 'SUSPICIOUS_ACTIVITY',
                    userId: event.userId,
                    metadata: {
                        reason: 'RAPID_ROLE_CHANGES',
                        count: recentRoleChanges
                    }
                });
            }
        }

        // Check for unusual access patterns
        if (event.type === 'UNAUTHORIZED_ACCESS') {
            const recentUnauthorized = await prisma.auditLog.count({
                where: {
                    userId: event.userId,
                    action: 'SECURITY_UNAUTHORIZED_ACCESS',
                    createdAt: {
                        gte: oneHourAgo
                    }
                }
            });

            if (recentUnauthorized >= 10) {
                await this.logEvent({
                    type: 'SUSPICIOUS_ACTIVITY',
                    userId: event.userId,
                    metadata: {
                        reason: 'REPEATED_UNAUTHORIZED_ACCESS',
                        count: recentUnauthorized
                    }
                });
            }
        }
    }

    /**
     * Get security events for user
     */
    async getUserSecurityEvents(
        userId: string,
        limit: number = 50
    ): Promise<any[]> {
        return prisma.auditLog.findMany({
            where: {
                userId,
                action: {
                    startsWith: 'SECURITY_'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }

    /**
     * Get security events for brand
     */
    async getBrandSecurityEvents(
        brandId: string,
        limit: number = 100
    ): Promise<any[]> {
        return prisma.auditLog.findMany({
            where: {
                brandId,
                action: {
                    startsWith: 'SECURITY_'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }

    /**
     * Get suspicious activity summary
     */
    async getSuspiciousActivitySummary(days: number = 7): Promise<any> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const events = await prisma.auditLog.findMany({
            where: {
                action: 'SECURITY_SUSPICIOUS_ACTIVITY',
                createdAt: {
                    gte: startDate
                }
            }
        });

        const summary = {
            totalEvents: events.length,
            byReason: {} as Record<string, number>,
            byUser: {} as Record<string, number>
        };

        for (const event of events) {
            const reason = event.metadata?.reason || 'UNKNOWN';
            summary.byReason[reason] = (summary.byReason[reason] || 0) + 1;

            if (event.userId) {
                summary.byUser[event.userId] = (summary.byUser[event.userId] || 0) + 1;
            }
        }

        return summary;
    }

    /**
     * Generate security report
     */
    async generateSecurityReport(
        brandId: string,
        startDate: Date,
        endDate: Date
    ): Promise<any> {
        const events = await prisma.auditLog.findMany({
            where: {
                brandId,
                action: {
                    startsWith: 'SECURITY_'
                },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const report = {
            period: { start: startDate, end: endDate },
            totalEvents: events.length,
            byType: {} as Record<string, number>,
            loginAttempts: {
                success: 0,
                failure: 0
            },
            unauthorizedAccess: 0,
            suspiciousActivity: 0
        };

        for (const event of events) {
            const type = event.action.replace('SECURITY_', '');
            report.byType[type] = (report.byType[type] || 0) + 1;

            if (type === 'LOGIN_SUCCESS') report.loginAttempts.success++;
            if (type === 'LOGIN_FAILURE') report.loginAttempts.failure++;
            if (type === 'UNAUTHORIZED_ACCESS') report.unauthorizedAccess++;
            if (type === 'SUSPICIOUS_ACTIVITY') report.suspiciousActivity++;
        }

        return report;
    }
}

// Export singleton instance
export const securityAudit = new SecurityAuditService();
