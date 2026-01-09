
import { prisma } from '@/lib/prisma';

export interface SynergyOpportunity {
    itemName: string;
    totalVolume: number;
    unit: string;
    brandsInvolved: string[];
    potentialSavings: number; // Estimated 10% savings
}

export class ProcurementSynergyService {

    // Normalize item names to find matches (e.g. "Gula Pasir" == "gula pasir")
    private normalizeName(name: string): string {
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    async analyzeSynergy(): Promise<SynergyOpportunity[]> {
        // 1. Fetch all frozen variants (as proxy for inventory items) from active brands
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        // Map to store aggregated volumes: "item_name" -> data
        const itemMap = new Map<string, {
            volume: number;
            unit: string;
            brandNames: Set<string>;
        }>();

        for (const brand of brands) {
            // Fetch Frozen Variants
            // Note: In a full system, we would check 'raw materials', 
            // but here we align on 'variants' which represent stock items.
            const variants = await prisma.frozenVariant.findMany({
                where: { product: { category: { brandId: brand.id } } }
            });

            for (const v of variants) {
                const name = this.normalizeName(v.name);
                const existing = itemMap.get(name) || { volume: 0, unit: v.unit, brandNames: new Set() };

                existing.volume += v.stockOnHand;
                existing.brandNames.add(brand.name);
                existing.unit = v.unit;

                itemMap.set(name, existing);
            }
        }

        // 2. Identify Synergy Opportunities
        const opportunities: SynergyOpportunity[] = [];

        itemMap.forEach((data, name) => {
            // Rule: Item must be used by at least 2 brands
            if (data.brandNames.size >= 2) {
                // Estimated savings: 10% of total value (assuming price 5000/unit as placeholder since costPrice might vary)
                const estimatedValue = data.volume * 5000;
                const savings = estimatedValue * 0.10;

                opportunities.push({
                    itemName: name.charAt(0).toUpperCase() + name.slice(1),
                    totalVolume: data.volume,
                    unit: data.unit,
                    brandsInvolved: Array.from(data.brandNames),
                    potentialSavings: savings
                });
            }
        });

        // Sort by highest potential savings
        return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }
}
