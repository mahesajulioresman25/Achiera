import { Decimal } from '@prisma/client/runtime/library';
import { PriceComponentType, PriceScope } from '@prisma/client';

/**
 * Input for price calculation
 */
export type OrderInput = {
    variantId: string;
    qty: number;
    printing?: {
        method: 'plastisol' | 'dtf' | 'heatpress';
        colors?: number;
        size?: 'S' | 'M' | 'L' | 'XL' | 'XXL';
        lengthMeter?: number; // for DTF
    };
    currency?: string;
};

/**
 * Individual breakdown item in price calculation
 */
export type BreakdownItem = {
    code: string;
    name: string;
    componentType: PriceComponentType;
    unit?: Decimal | number;
    qty?: number;
    colors?: number;
    amount: Decimal | number;
    metadata?: any;
    ruleId?: string;
};

/**
 * Complete price calculation result
 */
export type PriceCalculationResult = {
    total: Decimal;
    breakdown: BreakdownItem[];
    appliedRules: AppliedRule[];
    usedFallback: boolean; // true if using MockupVariant.price
};

/**
 * Information about which rule was applied
 */
export type AppliedRule = {
    ruleId: string;
    componentCode: string;
    scope: PriceScope;
    scopeId?: string | null;
    priority: number;
};

/**
 * Price rule with component info (for internal use)
 */
export type PriceRuleWithComponent = {
    id: string;
    componentId: string;
    scope: PriceScope;
    scopeId: string | null;
    priority: number;
    currency: string;
    amount: Decimal;
    minQty: number | null;
    maxQty: number | null;
    minOrderMeter: Decimal | null;
    metadata: any;
    isActive: boolean;
    startAt: Date | null;
    endAt: Date | null;
    component: {
        code: string;
        name: string;
        type: PriceComponentType;
    };
};

/**
 * Variant with product and brand info (for scope resolution)
 */
export type VariantWithRelations = {
    id: string;
    price: Decimal;
    product: {
        id: string;
        category: {
            brandId: string;
        };
    };
};
