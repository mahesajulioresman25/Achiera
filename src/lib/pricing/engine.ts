import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { PriceComponentType, PriceScope } from '@prisma/client';
import {
    OrderInput,
    PriceCalculationResult,
    BreakdownItem,
    AppliedRule,
    PriceRuleWithComponent,
    VariantWithRelations
} from './types';

/**
 * Main pricing calculation engine
 * Calculates total price with detailed breakdown based on pricing rules
 * Falls back to MockupVariant.price if no pricing rules are active
 */
export async function calculatePrice(order: OrderInput): Promise<PriceCalculationResult> {
    // 1. Load variant with relations
    const variant = await loadVariant(order.variantId);
    if (!variant) {
        throw new Error(`Variant ${order.variantId} not found`);
    }

    // 2. Load all active pricing rules
    const rules = await loadActivePricingRules(variant, order.currency || 'IDR');

    // 3. If no pricing rules exist, use fallback (existing MockupVariant.price)
    if (rules.length === 0) {
        return createFallbackPricing(variant, order.qty);
    }

    // 4. Calculate price using rules
    const breakdown: BreakdownItem[] = [];
    const appliedRules: AppliedRule[] = [];

    // 4a. Base unit price (with bulk tier if applicable)
    const basePrice = calculateBasePrice(rules, order.qty, breakdown, appliedRules);

    // 4b. Printing costs (if applicable)
    if (order.printing) {
        calculatePrintingCosts(rules, order, breakdown, appliedRules);
    }

    // 5. Calculate total
    const total = breakdown.reduce((sum, item) => {
        return new Decimal(sum).plus(new Decimal(item.amount));
    }, new Decimal(0));

    return {
        total,
        breakdown,
        appliedRules,
        usedFallback: false
    };
}

/**
 * Load variant with product and brand relations
 */
async function loadVariant(variantId: string): Promise<VariantWithRelations | null> {
    return await prisma.frozenVariant.findUnique({
        where: { id: variantId },
        select: {
            id: true,
            price: true,
            product: {
                select: {
                    id: true,
                    category: {
                        select: {
                            brandId: true
                        }
                    }
                }
            }
        }
    });
}

/**
 * Load all active pricing rules for this variant
 * Includes rules from all scopes (GLOBAL, BRAND, PRODUCT, VARIANT)
 */
async function loadActivePricingRules(
    variant: VariantWithRelations,
    currency: string
): Promise<PriceRuleWithComponent[]> {
    const now = new Date();

    const rules = await prisma.priceRule.findMany({
        where: {
            isActive: true,
            currency,
            OR: [
                // GLOBAL rules
                { scope: PriceScope.GLOBAL, scopeId: null },
                // BRAND rules
                { scope: PriceScope.BRAND, scopeId: variant.product.category.brandId },
                // PRODUCT rules
                { scope: PriceScope.PRODUCT, scopeId: variant.product.id },
                // VARIANT rules
                { scope: PriceScope.VARIANT, scopeId: variant.id }
            ],
            AND: [
                {
                    OR: [
                        { startAt: null },
                        { startAt: { lte: now } }
                    ]
                },
                {
                    OR: [
                        { endAt: null },
                        { endAt: { gte: now } }
                    ]
                }
            ]
        },
        include: {
            component: {
                select: {
                    code: true,
                    name: true,
                    type: true
                }
            }
        },
        orderBy: {
            priority: 'desc' // Higher priority first
        }
    });

    return rules as PriceRuleWithComponent[];
}

/**
 * Create fallback pricing using existing MockupVariant.price
 */
function createFallbackPricing(variant: VariantWithRelations, qty: number): PriceCalculationResult {
    const unitPrice = new Decimal(variant.price);
    const total = unitPrice.times(qty);

    return {
        total,
        breakdown: [
            {
                code: 'LEGACY_PRICE',
                name: 'Base Price (Legacy)',
                componentType: PriceComponentType.PER_UNIT,
                unit: unitPrice,
                qty,
                amount: total
            }
        ],
        appliedRules: [],
        usedFallback: true
    };
}

/**
 * Calculate base unit price with bulk tier logic
 */
function calculateBasePrice(
    rules: PriceRuleWithComponent[],
    qty: number,
    breakdown: BreakdownItem[],
    appliedRules: AppliedRule[]
): Decimal {
    // Try to find bulk tier rule first (higher priority)
    const bulkTierRules = filterRulesByComponent(rules, 'BULK_TIER');
    const bulkTierRule = findMatchingRule(bulkTierRules, qty);

    if (bulkTierRule) {
        const unitPrice = new Decimal(bulkTierRule.amount);
        const total = unitPrice.times(qty);

        breakdown.push({
            code: 'BULK_TIER',
            name: `${bulkTierRule.component.name} (${bulkTierRule.minQty}-${bulkTierRule.maxQty || '∞'} pcs)`,
            componentType: bulkTierRule.component.type,
            unit: unitPrice,
            qty,
            amount: total,
            ruleId: bulkTierRule.id
        });

        appliedRules.push({
            ruleId: bulkTierRule.id,
            componentCode: 'BULK_TIER',
            scope: bulkTierRule.scope,
            scopeId: bulkTierRule.scopeId,
            priority: bulkTierRule.priority
        });

        return total;
    }

    // Fallback to BASE_UNIT
    const baseUnitRules = filterRulesByComponent(rules, 'BASE_UNIT');
    const baseUnitRule = findBestRule(baseUnitRules);

    if (baseUnitRule) {
        const unitPrice = new Decimal(baseUnitRule.amount);
        const total = unitPrice.times(qty);

        breakdown.push({
            code: 'BASE_UNIT',
            name: baseUnitRule.component.name,
            componentType: baseUnitRule.component.type,
            unit: unitPrice,
            qty,
            amount: total,
            ruleId: baseUnitRule.id
        });

        appliedRules.push({
            ruleId: baseUnitRule.id,
            componentCode: 'BASE_UNIT',
            scope: baseUnitRule.scope,
            scopeId: baseUnitRule.scopeId,
            priority: baseUnitRule.priority
        });

        return total;
    }

    // No base price found - return 0 (should not happen with proper seed data)
    return new Decimal(0);
}

/**
 * Calculate printing costs (setup fee, per-color, size multiplier, DTF per-meter)
 */
function calculatePrintingCosts(
    rules: PriceRuleWithComponent[],
    order: OrderInput,
    breakdown: BreakdownItem[],
    appliedRules: AppliedRule[]
): void {
    if (!order.printing) return;

    const { method, colors, size, lengthMeter } = order.printing;

    // 1. Setup fee (FIXED)
    const setupRules = filterRulesByComponent(rules, 'PRINT_SETUP');
    const setupRule = setupRules.find(r => r.metadata?.printMethod === method);

    if (setupRule) {
        const amount = new Decimal(setupRule.amount);

        breakdown.push({
            code: 'PRINT_SETUP',
            name: `${method.toUpperCase()} Setup Fee`,
            componentType: setupRule.component.type,
            amount,
            metadata: { printMethod: method },
            ruleId: setupRule.id
        });

        appliedRules.push({
            ruleId: setupRule.id,
            componentCode: 'PRINT_SETUP',
            scope: setupRule.scope,
            scopeId: setupRule.scopeId,
            priority: setupRule.priority
        });
    }

    // 2. Per-color cost (PER_UNIT)
    if (colors && colors > 0 && method === 'plastisol') {
        const perColorRules = filterRulesByComponent(rules, 'PER_COLOR');
        const perColorRule = perColorRules.find(r => r.metadata?.printMethod === method);

        if (perColorRule) {
            const perColorAmount = new Decimal(perColorRule.amount);
            const total = perColorAmount.times(colors).times(order.qty);

            breakdown.push({
                code: 'PER_COLOR',
                name: `Per Color (${colors} colors)`,
                componentType: perColorRule.component.type,
                unit: perColorAmount,
                qty: order.qty,
                colors,
                amount: total,
                metadata: { printMethod: method, colors },
                ruleId: perColorRule.id
            });

            appliedRules.push({
                ruleId: perColorRule.id,
                componentCode: 'PER_COLOR',
                scope: perColorRule.scope,
                scopeId: perColorRule.scopeId,
                priority: perColorRule.priority
            });
        }
    }

    // 3. Size multiplier (MULTIPLIER)
    if (size) {
        const sizeRules = filterRulesByComponent(rules, 'SIZE_MULT');
        const sizeRule = sizeRules.find(r => r.metadata?.size === size);

        if (sizeRule) {
            // Get multiplier from metadata (e.g., "1.2") instead of amount
            const multiplierValue = sizeRule.metadata?.multiplier || sizeRule.amount;
            const multiplier = new Decimal(multiplierValue);

            // Apply multiplier to base unit price
            // Find base price from breakdown
            const baseItem = breakdown.find(b => b.code === 'BASE_UNIT' || b.code === 'BULK_TIER');
            if (baseItem && baseItem.unit) {
                const baseUnitPrice = new Decimal(baseItem.unit);
                const extra = baseUnitPrice.times(multiplier.minus(1)).times(order.qty);

                breakdown.push({
                    code: 'SIZE_MULT',
                    name: `Size ${size} Multiplier (${multiplier}x)`,
                    componentType: sizeRule.component.type,
                    unit: multiplier,
                    qty: order.qty,
                    amount: extra,
                    metadata: { size, multiplier: multiplier.toString() },
                    ruleId: sizeRule.id
                });

                appliedRules.push({
                    ruleId: sizeRule.id,
                    componentCode: 'SIZE_MULT',
                    scope: sizeRule.scope,
                    scopeId: sizeRule.scopeId,
                    priority: sizeRule.priority
                });
            }
        }
    }

    // 4. DTF per-meter (PER_METER)
    if (method === 'dtf' && lengthMeter) {
        const perMeterRules = filterRulesByComponent(rules, 'PER_METER');
        const perMeterRule = perMeterRules.find(r => r.metadata?.printMethod === method);

        if (perMeterRule) {
            const minMeter = perMeterRule.minOrderMeter ? new Decimal(perMeterRule.minOrderMeter) : new Decimal(1);
            const actualMeter = new Decimal(lengthMeter).greaterThanOrEqualTo(minMeter)
                ? new Decimal(lengthMeter)
                : minMeter;

            const perMeterAmount = new Decimal(perMeterRule.amount);
            const total = perMeterAmount.times(actualMeter);

            breakdown.push({
                code: 'PER_METER',
                name: `DTF Per Meter (${actualMeter}m)`,
                componentType: perMeterRule.component.type,
                unit: perMeterAmount,
                qty: actualMeter.toNumber(),
                amount: total,
                metadata: { printMethod: method, lengthMeter: actualMeter.toString() },
                ruleId: perMeterRule.id
            });

            appliedRules.push({
                ruleId: perMeterRule.id,
                componentCode: 'PER_METER',
                scope: perMeterRule.scope,
                scopeId: perMeterRule.scopeId,
                priority: perMeterRule.priority
            });
        }
    }
}

/**
 * Filter rules by component code
 */
function filterRulesByComponent(rules: PriceRuleWithComponent[], componentCode: string): PriceRuleWithComponent[] {
    return rules.filter(r => r.component.code === componentCode);
}

/**
 * Find matching rule based on quantity range
 */
function findMatchingRule(rules: PriceRuleWithComponent[], qty: number): PriceRuleWithComponent | undefined {
    return rules.find(r => {
        const min = r.minQty ?? 0;
        const max = r.maxQty ?? Infinity;
        return qty >= min && qty <= max;
    });
}

/**
 * Find best rule based on scope priority (VARIANT > PRODUCT > BRAND > GLOBAL)
 * and then by priority number
 */
function findBestRule(rules: PriceRuleWithComponent[]): PriceRuleWithComponent | undefined {
    if (rules.length === 0) return undefined;

    // Scope priority weights
    const scopeWeight = {
        [PriceScope.VARIANT]: 4,
        [PriceScope.PRODUCT]: 3,
        [PriceScope.BRAND]: 2,
        [PriceScope.GLOBAL]: 1
    };

    // Sort by scope weight (desc) then by priority (desc)
    const sorted = [...rules].sort((a, b) => {
        const scopeDiff = scopeWeight[b.scope] - scopeWeight[a.scope];
        if (scopeDiff !== 0) return scopeDiff;
        return b.priority - a.priority;
    });

    return sorted[0];
}
