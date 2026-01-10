
import { unisolatedPrisma as prisma } from "@/lib/prisma";
import { OwnerService } from './OwnerService';

export interface WorkforceMetric {
    brandName: string;
    employeeCount: number;
    revenue: number;
    revenuePerEmployee: number;
    efficiencyStatus: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class WorkforceAnalyticsService {
    async getWorkforceMetrics(): Promise<WorkforceMetric[]> {
        const ownerService = new OwnerService();
        const brandStats = await ownerService.getBrandComparison(); // Uses OwnerService to get revenue

        const metrics: WorkforceMetric[] = [];

        for (const stat of brandStats) {
            // Fetch User Count (Proxy for Staff)
            // In real app, might filter by role != 'CUSTOMER'
            const userCount = await prisma.userBrandRole.count({
                where: {
                    brandId: stat.id,
                    role: { not: 'CONSUMER' } // Exclude customers if role exists, simpler for now
                }
            });

            // Avoid division by zero
            const count = userCount || 1;
            const revPerEmp = stat.revenue / count;

            let status: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
            if (revPerEmp > 10000000) status = 'HIGH'; // > 10 Juta per orang
            else if (revPerEmp < 1000000) status = 'LOW'; // < 1 Juta per orang

            metrics.push({
                brandName: stat.name,
                employeeCount: count,
                revenue: stat.revenue,
                revenuePerEmployee: revPerEmp,
                efficiencyStatus: status
            });
        }

        return metrics.sort((a, b) => b.revenuePerEmployee - a.revenuePerEmployee);
    }
}
