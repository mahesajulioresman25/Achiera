'use server';

import { ProcurementEngine } from '@/lib/intelligence/procurementEngine';

/**
 * Get procurement advice for a brand
 */
export async function getProcurementAdviceAction(brandId: string) {
    try {
        const advice = await ProcurementEngine.generateProcurementSuggestions(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(advice)) };
    } catch (error: any) {
        console.error('[ProcurementAction] Error:', error);
        return { success: false, error: error.message };
    }
}
