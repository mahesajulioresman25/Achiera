'use server';

import { KPIService } from '@/lib/services/KPIService';
import { revalidatePath } from 'next/cache';

const kpiService = new KPIService();

export async function getKPIDashboardAction(brandId: string) {
    try {
        const dashboard = await kpiService.getKPIDashboard(brandId);
        return { success: true, data: dashboard };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getConsolidatedKPIsAction() {
    try {
        const consolidated = await kpiService.getConsolidatedKPIs();
        return { success: true, data: consolidated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
