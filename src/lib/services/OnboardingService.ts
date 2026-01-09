import { prisma } from "@/lib/prisma";
import { BrandRole } from "@prisma/client";

type OnboardingParams = {
    name: string;
    slug: string;
    organizationId?: string; // Optional
    adminUserId: string;
};

export class OnboardingService {

    /**
     * Orchestrates the creation of a fully functional Brand
     */
    async onboardingBrand(params: OnboardingParams) {
        return prisma.$transaction(async (tx) => {
            // 1. Create Brand
            const brand = await tx.brand.create({
                data: {
                    name: params.name,
                    slug: params.slug,
                    organizationId: params.organizationId,
                    isActive: true
                }
            });

            // 2. Create Defaults Config
            await tx.brandConfig.create({
                data: {
                    brandId: brand.id,
                    features: {
                        loyalty: false,
                        ads: false,
                        subscriptions: false
                    },
                    pricingStrategy: 'STANDARD',
                    // Use system defaults for null fields (warehouseRules, loyaltyRules)
                }
            });

            // 3. Hydrate Ledger (Standard Chart of Accounts)
            const standardAccounts = [
                { code: '1000', name: 'Cash on Hand', type: 'ASSET' },
                { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
                { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
                { code: '6000', name: 'COGS', type: 'EXPENSE' },
                { code: '6100', name: 'Marketing Expense', type: 'EXPENSE' },
            ];

            for (const acc of standardAccounts) {
                await tx.ledgerAccount.create({
                    data: {
                        brandId: brand.id,
                        code: acc.code,
                        name: acc.name,
                        type: acc.type
                    }
                });
            }

            // 4. Assign Creator as BRAND_ADMIN
            await tx.userBrandRole.create({
                data: {
                    userId: params.adminUserId,
                    brandId: brand.id,
                    role: 'BRAND_ADMIN'
                }
            });

            // 5. Initial Warehouse Setup (Optional Placeholder)
            // We don't create a warehouse *location* yet as our simplified schema uses 'InventoryBatch' per brand.
            // But we could create a default 'Uncategorized' Category if needed.

            return brand;
        });
    }

    /**
     * Migration Helper: Retroactively setup config for existing brands
     */
    async fixMissingConfigs() {
        const brands = await prisma.brand.findMany({
            where: { config: null },
            include: { config: true }
        });

        for (const brand of brands) {
            // Create default config if missing
            await prisma.brandConfig.create({
                data: {
                    brandId: brand.id,
                    features: {
                        loyalty: false,
                        ads: false,
                        subscriptions: false
                    },
                    pricingStrategy: 'STANDARD'
                }
            });
        }
        return `Fixed ${brands.length} brands`;
    }
}
