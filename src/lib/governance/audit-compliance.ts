// ACHIERA Platform - Audit & Compliance Readiness
// Comprehensive audit trail and compliance reporting

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { logger } from '@/lib/observability/logger';

export type ComplianceReportType =
    | 'FINANCIAL_AUDIT'
    | 'DATA_PRIVACY'
    | 'SECURITY_AUDIT'
    | 'TRANSACTION_HISTORY'
    | 'USER_ACTIVITY'
    | 'SYSTEM_CHANGES';

/**
 * Audit and compliance service
 */
export class AuditComplianceService {
    /**
     * Generate compliance report
     */
    async generateReport(params: {
        type: ComplianceReportType;
        brandId?: string;
        startDate: Date;
        endDate: Date;
        requestedBy: string;
    }): Promise<any> {
        const log = logger.child({
            userId: params.requestedBy,
            brandId: params.brandId
        });

        log.info('Generating compliance report', {
            type: params.type,
            startDate: params.startDate,
            endDate: params.endDate
        });

        let report: any;

        switch (params.type) {
            case 'FINANCIAL_AUDIT':
                report = await this.generateFinancialAudit(params);
                break;

            case 'DATA_PRIVACY':
                report = await this.generateDataPrivacyReport(params);
                break;

            case 'SECURITY_AUDIT':
                report = await this.generateSecurityAudit(params);
                break;

            case 'TRANSACTION_HISTORY':
                report = await this.generateTransactionHistory(params);
                break;

            case 'USER_ACTIVITY':
                report = await this.generateUserActivityReport(params);
                break;

            case 'SYSTEM_CHANGES':
                report = await this.generateSystemChangesReport(params);
                break;
        }

        // Create report record
        const reportRecord = await prisma.complianceReport.create({
            data: {
                type: params.type,
                brandId: params.brandId,
                startDate: params.startDate,
                endDate: params.endDate,
                requestedBy: params.requestedBy,
                data: report,
                status: 'COMPLETED'
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: params.requestedBy,
                brandId: params.brandId,
                action: 'COMPLIANCE_REPORT_GENERATED',
                entityType: 'REPORT',
                entityId: reportRecord.id,
                metadata: {
                    type: params.type,
                    period: {
                        start: params.startDate,
                        end: params.endDate
                    }
                }
            }
        });

        return reportRecord;
    }

    /**
     * Generate financial audit report
     */
    private async generateFinancialAudit(params: any): Promise<any> {
        const transactions = await prisma.journalTransaction.findMany({
            where: {
                brandId: params.brandId,
                date: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            },
            include: {
                entries: {
                    include: {
                        account: true
                    }
                }
            }
        });

        // Verify all transactions balance
        const imbalances = [];
        for (const tx of transactions) {
            const totalDebit = tx.entries.reduce((sum, e) => sum + Number(e.debit), 0);
            const totalCredit = tx.entries.reduce((sum, e) => sum + Number(e.credit), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                imbalances.push({
                    transactionId: tx.id,
                    debit: totalDebit,
                    credit: totalCredit,
                    difference: totalDebit - totalCredit
                });
            }
        }

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalTransactions: transactions.length,
            imbalances,
            isBalanced: imbalances.length === 0,
            transactions: transactions.map(tx => ({
                id: tx.id,
                date: tx.date,
                description: tx.description,
                entries: tx.entries.map(e => ({
                    account: e.account.code,
                    debit: Number(e.debit),
                    credit: Number(e.credit)
                }))
            }))
        };
    }

    /**
     * Generate data privacy report (GDPR/UU PDP compliance)
     */
    private async generateDataPrivacyReport(params: any): Promise<any> {
        const users = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Get data access logs
        const accessLogs = await prisma.auditLog.findMany({
            where: {
                action: 'SENSITIVE_DATA_ACCESS' as any,
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            }
        });

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalUsers: users.length,
            dataAccessEvents: accessLogs.length,
            usersByMonth: this.groupByMonth(users, 'createdAt'),
            accessByType: this.groupBy(accessLogs, 'metadata.dataType')
        };
    }

    /**
     * Generate security audit report
     */
    private async generateSecurityAudit(params: any): Promise<any> {
        const securityEvents = await prisma.auditLog.findMany({
            where: {
                action: {
                    in: [
                        'SECURITY_LOGIN_SUCCESS',
                        'SECURITY_LOGIN_FAILURE'
                    ] as any
                },
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            }
        });

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalEvents: securityEvents.length,
            eventsByType: this.groupBy(securityEvents, 'action'),
            criticalEvents: securityEvents.filter(e =>
                e.action.includes('CRITICAL') || e.action.includes('UNAUTHORIZED')
            ),
            loginAttempts: {
                success: securityEvents.filter(e => e.action === 'SECURITY_LOGIN_SUCCESS').length,
                failure: securityEvents.filter(e => e.action === 'SECURITY_LOGIN_FAILURE').length
            }
        };
    }

    /**
     * Generate transaction history
     */
    private async generateTransactionHistory(params: any): Promise<any> {
        const orders = await prisma.order.findMany({
            where: {
                brandId: params.brandId,
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            },
            include: {
                orderItems: true,
                payments: true
            } as any
        });

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
            ordersByStatus: this.groupBy(orders, 'status'),
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: (o as any).invoiceNo,
                total: Number(o.total),
                status: o.status,
                createdAt: o.createdAt,
                items: (o as any).orderItems?.length || 0,
                payments: (o as any).payments?.map((p: any) => ({
                    amount: Number(p.amount),
                    method: p.type,
                    status: 'COMPLETED'
                }))
            }))
        };
    }

    /**
     * Generate user activity report
     */
    private async generateUserActivityReport(params: any): Promise<any> {
        const activities = await prisma.auditLog.findMany({
            where: {
                brandId: params.brandId,
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            }
        });

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalActivities: activities.length,
            activitiesByUser: this.groupBy(activities, 'userId'),
            activitiesByAction: this.groupBy(activities, 'action'),
            timeline: this.groupByDay(activities, 'createdAt')
        };
    }

    /**
     * Generate system changes report
     */
    private async generateSystemChangesReport(params: any): Promise<any> {
        const changes = await prisma.auditLog.findMany({
            where: {
                action: {
                    in: [
                        'ROLE_CHANGED',
                        'BRAND_FREEZE',
                        'KILL_SWITCH_ACTIVATED',
                        'SYSTEM_CONFIG_CHANGE'
                    ] as any
                },
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            }
        });

        return {
            period: {
                start: params.startDate,
                end: params.endDate
            },
            totalChanges: changes.length,
            changesByType: this.groupBy(changes, 'action'),
            changes: changes.map(c => ({
                timestamp: c.createdAt,
                action: c.action,
                userId: c.userId,
                entityType: c.entityType,
                entityId: c.entityId,
                metadata: c.metadata
            }))
        };
    }

    /**
     * Helper: Group by field
     */
    private groupBy(items: any[], field: string): Record<string, number> {
        return items.reduce((acc, item) => {
            const value = this.getNestedValue(item, field) || 'unknown';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Helper: Group by month
     */
    private groupByMonth(items: any[], field: string): Record<string, number> {
        return items.reduce((acc, item) => {
            const date = new Date(item[field]);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Helper: Group by day
     */
    private groupByDay(items: any[], field: string): Record<string, number> {
        return items.reduce((acc, item) => {
            const date = new Date(item[field]);
            const day = date.toISOString().split('T')[0];
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Helper: Get nested value
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Export audit logs for compliance
     */
    async exportAuditLogs(params: {
        brandId?: string;
        startDate: Date;
        endDate: Date;
        format: 'JSON' | 'CSV';
    }): Promise<string> {
        const logs = await prisma.auditLog.findMany({
            where: {
                ...(params.brandId ? { brandId: params.brandId } : {}),
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        if (params.format === 'CSV') {
            return this.convertToCSV(logs);
        }

        return JSON.stringify(logs, null, 2);
    }

    /**
     * Convert to CSV
     */
    private convertToCSV(data: any[]): string {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(item =>
            headers.map(header => JSON.stringify(item[header] || '')).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }
}

// Export singleton
export const auditCompliance = new AuditComplianceService();
