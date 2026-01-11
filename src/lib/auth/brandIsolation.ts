// ACHIERA Platform - Brand Isolation Middleware
// Prisma middleware to enforce brandId on all queries

import { Prisma } from '@prisma/client';

/**
 * Models that are brand-scoped (require brandId)
 */
const BRAND_SCOPED_MODELS = [
    'Order',
    'PaymentReconciliation',
    'FrozenCategory',
    'InventoryCategory',
    'FrozenProduct',
    'FrozenVariant',
    'InventoryBatch',
    'LedgerAccount',
    'JournalTransaction',
    'JournalEntry',
    'AuditLog',
    'ProductionPlan',
    'ProductionPlanItem',
    'Recipe',
    'RecipeItem',
    'ProductMapping',
    'MarketplaceDailySales',
    'MarketplaceCampaignReport',
    'CustomerReview',
    'MarketplaceInsight',
    'DemandForecast',
    'StockAlert',
    'PricingRule',
    'PriceHistory',
    'LoyaltyMember',
    'LoyaltyReward',
    'LoyaltyTransaction',
    'BusinessAsset',
    'AssetDepreciation',
    'InterCompanyTransaction',
    'Budget',
    'BudgetBreakdown',
    'SuggestionDraft',
    'SuggestionFeedback',
    'HumanAgreementSignal',
    'AssistedAction',
    'Warehouse',
    'Subscription',
    'SubscriptionPlan',
    'SubscriptionPlanProduct',
    'Campaign',
    'ProductBundle',
    'BundleItem',
    'FlashSaleConfig',
    'FlashSaleItem',
    'LoyaltyAccount',
    'WhatsAppQueue',
    'Anomaly',
    'StockMutation',
    'RecipePost',
    'SettlementBatch',
    'SettlementItem',
    'AdCampaign',
    'AdGroup',
    'AdCreative',
    'AdEvent',
    'RawImportFile',
    'RawRow',
    'InferredSchemaMapping',
    'SchemaConfidenceScore',
    'CanonicalSalesTransaction',
    'CanonicalAdsMetric',
    'SalesFact',
    'AdsPerformanceFact',
    'AggDailySales',
    'AggDailyAds',
    'AggWeeklyTrends',
    'AnalyticsDailySales',
    'AnalyticsDailyAds',
    'AnalyticsWeeklyTrends',
    'Recommendation',
    'SalesImportRaw',
    'AdsImportRaw',
    'ComplianceReport'
];

/**
 * Models that are globally accessible (no brandId required)
 */
const GLOBAL_MODELS = [
    'User',
    'Brand',
    'PriceComponent',
    'PriceRule',
    'SystemLog',
    'IdempotencyKey'
];

import { BrandIsolationError } from './brandIsolationError';

/**
 * Check if model requires brand isolation
 */
function requiresBrandId(model: string): boolean {
    return BRAND_SCOPED_MODELS.includes(model);
}

/**
 * Extract brandId from where clause (recursive support for nested paths)
 */
function getBrandIdFromWhere(where: any): string | null {
    if (!where || typeof where !== 'object') return null;

    // 1. Direct brandId check
    if (where.brandId) {
        if (typeof where.brandId === 'string') return where.brandId;
        if (where.brandId.equals) return where.brandId.equals;
    }

    // 2. brand: { id: ... } check
    if (where.brand?.id) {
        if (typeof where.brand.id === 'string') return where.brand.id;
        if (where.brand.id.equals) return where.brand.id.equals;
    }

    // 2b. InterCompany paths (fromBrandId, toBrandId)
    if (where.fromBrandId) {
        if (typeof where.fromBrandId === 'string') return where.fromBrandId;
        if (where.fromBrandId.equals) return where.fromBrandId.equals;
    }
    if (where.toBrandId) {
        if (typeof where.toBrandId === 'string') return where.toBrandId;
        if (where.toBrandId.equals) return where.toBrandId.equals;
    }

    // 3. Logical operators (OR, AND, NOT)
    if (Array.isArray(where.OR)) {
        for (const item of where.OR) {
            const nestedId = getBrandIdFromWhere(item);
            if (nestedId) return nestedId;
        }
    }
    if (Array.isArray(where.AND)) {
        for (const item of where.AND) {
            const nestedId = getBrandIdFromWhere(item);
            if (nestedId) return nestedId;
        }
    }
    if (where.NOT) {
        const nestedId = getBrandIdFromWhere(where.NOT);
        if (nestedId) return nestedId;
    }

    // 4. Common nested paths
    const nestedPaths = [
        'order', 'product', 'category', 'item', 'batch', 'inventoryCategory',
        'transaction', 'orderItem', 'account', 'warehouse', 'variant', 'plan',
        'recipe', 'suggestion', 'member', 'asset', 'subscription', 'brandRoles',
        'user'
    ];
    for (const path of nestedPaths) {
        if (where[path]) {
            const nestedId = getBrandIdFromWhere(where[path]);
            if (nestedId) return nestedId;
        }

        // Handle collection checks (some, every, none)
        if (where[path]?.some) {
            const nestedId = getBrandIdFromWhere(where[path].some);
            if (nestedId) return nestedId;
        }
    }

    // 5. Look for brandId inside any nested object (composite keys like brandId_customerPhone)
    for (const key in where) {
        if (where[key] && typeof where[key] === 'object') {
            if (where[key].brandId && typeof where[key].brandId === 'string') {
                return where[key].brandId;
            }
            // Optional: recurse one level deeper for composite keys
            if (key.includes('brandId')) {
                for (const subKey in where[key]) {
                    if (subKey === 'brandId' && typeof where[key][subKey] === 'string') {
                        return where[key][subKey];
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Prisma extension for brand isolation enforcement
 */
export const brandIsolationExtension =
    typeof window === 'undefined'
        ? Prisma.defineExtension({
            name: 'brandIsolation',
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        // Skip global models
                        if (GLOBAL_MODELS.includes(model)) {
                            return query(args);
                        }

                        // Enforce brandId for brand-scoped models
                        if (requiresBrandId(model)) {
                            // Read operations: findUnique, findFirst, findMany, count, aggregate, groupBy
                            if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                                const brandId = getBrandIdFromWhere((args as any).where);

                                if (!brandId) {
                                    console.error(`[BrandIsolation] Violation in ${model}.${operation}. Args:`, JSON.stringify(args, null, 2));
                                    throw new BrandIsolationError(
                                        `Brand isolation violation: ${model}.${operation} requires brandId in where clause`,
                                        model,
                                        operation
                                    );
                                }
                            }

                            // Write operations: create, createMany
                            if (['create', 'createMany'].includes(operation)) {
                                const data = (args as any).data;
                                if (Array.isArray(data)) {
                                    for (const item of data) {
                                        if (!item.brandId) {
                                            throw new BrandIsolationError(
                                                `Brand isolation violation: ${model}.${operation} requires brandId in data`,
                                                model,
                                                operation
                                            );
                                        }
                                    }
                                } else if (!data?.brandId) {
                                    throw new BrandIsolationError(
                                        `Brand isolation violation: ${model}.${operation} requires brandId in data`,
                                        model,
                                        operation
                                    );
                                }
                            }

                            // Mutation operations: update, updateMany, upsert, delete, deleteMany
                            if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
                                const brandId = getBrandIdFromWhere((args as any).where);

                                if (!brandId) {
                                    throw new BrandIsolationError(
                                        `Brand isolation violation: ${model}.${operation} requires brandId in where clause`,
                                        model,
                                        operation
                                    );
                                }
                            }
                        }

                        return query(args);
                    },
                },
            },
        })
        : null as any;

/**
 * Bypass brand isolation for specific operations (use with extreme caution)
 * Only for platform-level operations
 */
export async function withoutBrandIsolation<T>(
    operation: () => Promise<T>
): Promise<T> {
    // Temporarily disable middleware
    // Note: This is a simplified version. In production, you'd need a more sophisticated approach
    // such as using a separate Prisma client instance or a context flag

    // For now, we'll just execute the operation
    // The middleware will still run, but you can add a context flag to skip it
    return operation();
}

/**
 * Helper to validate brandId matches user's brand
 */
export function validateBrandAccess(
    userBrandId: string | null,
    targetBrandId: string,
    userRole: string
): void {
    // Platform owners can access any brand
    if (userRole === 'PLATFORM_OWNER' || userRole === 'PLATFORM_ADMIN') {
        return;
    }

    // Brand users can only access their own brand
    if (userBrandId !== targetBrandId) {
        throw new BrandIsolationError(
            `Brand access denied: User brand ${userBrandId} cannot access brand ${targetBrandId}`,
            'Brand',
            'access'
        );
    }
}
