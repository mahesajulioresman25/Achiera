'use server';

import { ReportService, ReportType } from '@/lib/services/ReportService';

const reportService = new ReportService();

export async function generateReportAction(type: ReportType) {
    try {
        const report = await reportService.generateReport(type);
        return { success: true, data: report };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
