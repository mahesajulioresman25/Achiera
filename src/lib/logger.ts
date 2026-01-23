import { prisma } from '@/lib/prisma';

export type LogType = 'EMAIL_SEND' | 'EMAIL_PARSE' | 'CRON' | 'SYSTEM' | 'REPORT_GENERATED';
export type LogSeverity = 'INFO' | 'WARN' | 'ERROR';

export async function logSystemActivity(
    type: LogType,
    severity: LogSeverity,
    message: string,
    metadata?: any,
    brandId?: string
) {
    try {
        await prisma.appLog.create({
            data: {
                type,
                severity,
                message,
                metadata: metadata || {},
                brandId
            }
        });
    } catch (error) {
        console.error('Failed to write system log:', error);
    }
}
