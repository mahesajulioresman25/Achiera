import { prisma } from "@/lib/prisma";

type BrandFeatures = {
    loyalty: boolean;
    ads: boolean;
    subscriptions: boolean;
    blog: boolean;
};

type LoyaltyConfig = {
    earnRate: number;      // e.g. 0.001
    expiryDays: number;
    tiers: { name: string; threshold: number; multiplier: number }[];
};

const DEFAULT_LOYALTY: LoyaltyConfig = {
    earnRate: 0.001,
    expiryDays: 365,
    tiers: [
        { name: 'BRONZE', threshold: 0, multiplier: 1.0 },
        { name: 'SILVER', threshold: 1000, multiplier: 1.2 },
        { name: 'GOLD', threshold: 5000, multiplier: 1.5 }
    ]
};

export class ConfigService {

    /**
     * Get Full Configuration for a Brand
     * Caches should be implemented here in production (Redis/Memory)
     */
    async getConfig(brandId: string) {
        const config = await prisma.brandConfig.findUnique({
            where: { brandId }
        });

        return config;
    }

    /**
     * Check if a feature is enabled
     */
    async isFeatureEnabled(brandId: string, feature: keyof BrandFeatures): Promise<boolean> {
        const config = await this.getConfig(brandId);
        if (!config || !config.features) return false;

        const features = config.features as BrandFeatures;
        return !!features[feature];
    }

    /**
     * Get Loyalty Rules with Defaults
     */
    async getLoyaltyRules(brandId: string): Promise<LoyaltyConfig> {
        const config = await this.getConfig(brandId);
        if (!config || !config.loyaltyRules) return DEFAULT_LOYALTY;

        // Merge with defaults to ensure safety
        return { ...DEFAULT_LOYALTY, ...(config.loyaltyRules as any) };
    }

    /**
     * Get Pricing Strategy
     */
    async getPricingStrategy(brandId: string): Promise<string> {
        const config = await this.getConfig(brandId);
        return config?.pricingStrategy || "STANDARD";
    }
}
