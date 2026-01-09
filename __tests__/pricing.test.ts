import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { calculatePrice } from '../src/lib/pricing/engine';
import { PriceScope, PriceComponentType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma'; // Use singleton

// const prisma = new PrismaClient(); // Removed

describe('Pricing Engine', () => {
    let testBrandId: string;
    let testProductId: string;
    let testVariantId: string;

    // Helper for robust decimal comparison
    const checkDecimal = (received: any, expected: string) => {
        const receivedStr = new Decimal(received.toString()).toString();
        const expectedStr = new Decimal(expected).toString();
        // console.log(`Comparing: ${receivedStr} (type: ${typeof received}) vs ${expectedStr}`);
        if (receivedStr !== expectedStr) {
            console.error(`MISMATCH: Expected ${expectedStr}, Received ${receivedStr}`);
            console.error('Received raw:', received);
        }
        expect(receivedStr).toBe(expectedStr);
    };

    beforeAll(async () => {
        console.log('Checking models:');
        console.log('Brand:', !!prisma.brand);
        console.log('FrozenVariant:', !!prisma.frozenVariant);
        console.log('AuditLog:', !!prisma.auditLog);
        console.log('PriceComponent:', !!prisma.priceComponent);
        console.log('PriceRule:', !!prisma.priceRule);

        // 1. Create Test Brand
        const brand = await prisma.brand.create({
            data: {
                name: 'Pricing Test Brand',
                slug: `pricing-test-${Date.now()}`,
                isActive: true
            }
        });
        testBrandId = brand.id;

        // 2. Create Test Product & Variant (Frozen)
        const category = await prisma.frozenCategory.create({
            data: {
                brandId: brand.id,
                name: 'Pricing Test Category',
                slug: `pricing-cat-${Date.now()}`
            }
        });

        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: category.id,
                name: 'Pricing Test Product',
                slug: `pricing-prod-${Date.now()}`,
                storageType: 'FROZEN'
            }
        });
        testProductId = product.id;

        const variant = await prisma.frozenVariant.create({
            data: {
                productId: product.id,
                sku: `PRICING-SKU-${Date.now()}`,
                name: 'Pricing Test Variant',
                price: new Decimal(15000), // Fallback price
                stockOnHand: 100,
                weight: new Decimal(0.2)
            }
        });
        testVariantId = variant.id;

        // 3. Ensure Price Components exist
        const components = [
            { code: 'BASE_UNIT', name: 'Base Unit Price', type: PriceComponentType.PER_UNIT },
            { code: 'BULK_TIER', name: 'Bulk Tier Price', type: PriceComponentType.PER_UNIT },
            { code: 'PRINT_SETUP', name: 'Print Setup Fee', type: PriceComponentType.FIXED },
            { code: 'PER_COLOR', name: 'Per Color Charge', type: PriceComponentType.PER_UNIT },
            { code: 'SIZE_MULT', name: 'Size Multiplier', type: PriceComponentType.MULTIPLIER },
            { code: 'PER_METER', name: 'Per Meter Charge', type: PriceComponentType.PER_METER }
        ] as const;

        const componentMap: Record<string, string> = {};

        for (const comp of components) {
            // Check if exists first to avoid race condition/unique constraint issues in parallel tests
            const existing = await prisma.priceComponent.findUnique({
                where: { code: comp.code }
            });

            if (existing) {
                componentMap[comp.code] = existing.id;
            } else {
                try {
                    const c = await prisma.priceComponent.create({
                        data: {
                            code: comp.code,
                            name: comp.name,
                            type: comp.type
                        }
                    });
                    componentMap[comp.code] = c.id;
                } catch (error: any) {
                    // Reduce race condition risk
                    if (error.code === 'P2002') {
                        const c = await prisma.priceComponent.findUnique({
                            where: { code: comp.code }
                        });
                        if (c) componentMap[comp.code] = c.id;
                        else throw error;
                    } else {
                        throw error;
                    }
                }
            }
        }

        // 4. Create Price Rules
        // Rule 1: Base Price 15,000 (Global or Variant scope)
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['BASE_UNIT'],
                scope: PriceScope.VARIANT,
                scopeId: testVariantId,
                amount: '15000',
                priority: 10
            }
        });

        // Rule 2: Bulk Tier 10-49 -> 13,500
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['BULK_TIER'],
                scope: PriceScope.VARIANT,
                scopeId: testVariantId,
                amount: '13500',
                minQty: 10,
                maxQty: 49,
                priority: 20
            }
        });

        // Rule 3: Bulk Tier 50+ -> 12,000
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['BULK_TIER'],
                scope: PriceScope.VARIANT,
                scopeId: testVariantId,
                amount: '12000',
                minQty: 50,
                priority: 20
            }
        });

        // Rule 4: Print Setup (Plastisol) -> 30,000
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['PRINT_SETUP'],
                scope: PriceScope.GLOBAL,
                amount: '30000',
                metadata: { printMethod: 'plastisol' }
            }
        });

        // Rule 5: Per Color (Plastisol) -> 3,500
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['PER_COLOR'],
                scope: PriceScope.GLOBAL,
                amount: '3500',
                metadata: { printMethod: 'plastisol' }
            }
        });

        // Rule 6: Size Multiplier (XXL) -> 1.2
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['SIZE_MULT'],
                scope: PriceScope.GLOBAL,
                amount: '0',
                metadata: { size: 'XXL', multiplier: '1.2' }
            }
        });

        // Rule 7: Per Meter (DTF) -> 65,000
        await prisma.priceRule.create({
            data: {
                componentId: componentMap['PER_METER'],
                scope: PriceScope.GLOBAL,
                amount: '65000',
                metadata: { printMethod: 'dtf' }
            }
        });
    });

    afterAll(async () => {
        // Cleanup based on scopeId or created IDs
        if (testVariantId) await prisma.priceRule.deleteMany({ where: { scopeId: testVariantId } });
        // Clean up global rules created? Hard to distinguish without keeping IDs. 
        // For now, let's just clean up the product/variant which cascades to some, but PricingRules are separate.
        // In a real env we might use a transaction or specific IDs.
        // For this test, valid cleanup is best effort or using a unique scope if possible.

        // Delete setup data
        if (testVariantId) await prisma.frozenVariant.delete({ where: { id: testVariantId } });
        if (testProductId) await prisma.frozenProduct.delete({ where: { id: testProductId } });
        // Categories and Brand
        const cat = await prisma.frozenCategory.findFirst({ where: { slug: { startsWith: 'pricing-cat-' } } });
        if (cat) await prisma.frozenCategory.delete({ where: { id: cat.id } });
        if (testBrandId) await prisma.brand.delete({ where: { id: testBrandId } });

        await prisma.$disconnect();
    });

    /**
     * Test Case 1: No printing, qty 1
     * Expected: Base unit price only (15,000 IDR)
     */
    it('should calculate base unit price for qty 1 with no printing', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 1,
            currency: 'IDR'
        });

        expect(result.breakdown.length).toBeGreaterThan(0);
        // expect(result.total).toBeInstanceOf(Decimal); // This fails if instances differ, better check typeof or value

        // Should have base unit
        const hasBasePrice = result.breakdown.some(
            b => b.code === 'BASE_UNIT'
        );
        expect(hasBasePrice).toBe(true);

        // Total should be 15,000
        checkDecimal(result.total, '15000');
    });

    /**
     * Test Case 2: No printing, qty 20
     * Expected: Bulk tier price (13,500 IDR for 10-49 pcs)
     */
    it('should apply bulk tier for qty 20', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 20,
            currency: 'IDR'
        });

        // Should have bulk tier
        const bulkTier = result.breakdown.find(b => b.code === 'BULK_TIER');
        expect(bulkTier).toBeDefined();

        // Qty 20 should be in 10-49 range (13,500 per unit)
        if (bulkTier && bulkTier.unit) {
            checkDecimal(bulkTier.unit, '13500');
        }

        // Total should be 20 * 13,500 = 270,000
        checkDecimal(result.total, '270000');
    });

    /**
     * Test Case 3: Plastisol 2 colors, qty 10
     * Expected: Base + setup fee + per-color cost
     * Base: 13,500 * 10 = 135,000 (Bulk tier applies 10+)
     * Setup: 30,000
     * Colors: 3,500 * 2 * 10 = 70,000
     * Total: 235,000
     */
    it('should calculate plastisol printing with 2 colors', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 10,
            printing: {
                method: 'plastisol',
                colors: 2
            },
            currency: 'IDR'
        });

        // Should have setup fee (30,000)
        const setupFee = result.breakdown.find(b => b.code === 'PRINT_SETUP');
        expect(setupFee).toBeDefined();
        // Setup fee amount should be 30000
        checkDecimal(setupFee?.amount || 0, '30000');

        // Should have per-color cost
        const perColor = result.breakdown.find(b => b.code === 'PER_COLOR');
        expect(perColor).toBeDefined();
        // 70000
        checkDecimal(perColor?.amount || 0, '70000');

        // Total should be: base(135,000) + setup(30,000) + colors(70,000) = 235,000
        checkDecimal(result.total, '235000');
    });

    /**
     * Test Case 4: Plastisol size XXL, qty 5
     * Expected: Base + setup + size multiplier (1.2x)
     * Base: 15,000 * 5 = 75,000 (No bulk tier < 10)
     * Setup: 30,000
     * Multiplier: 75,000 * (1.2 - 1) = 15,000
     * Total: 75,000 + 30,000 + 15,000 = 120,000
     */
    it('should apply size multiplier for XXL', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 5,
            printing: {
                method: 'plastisol',
                size: 'XXL'
            },
            currency: 'IDR'
        });

        // Should have size multiplier
        const sizeMult = result.breakdown.find(b => b.code === 'SIZE_MULT');
        expect(sizeMult).toBeDefined();

        // XXL multiplier should be 1.2
        if (sizeMult && sizeMult.metadata) {
            expect(sizeMult.metadata.multiplier).toBe('1.2');
        }

        // Size multiplier should add extra cost
        // Base for 5 pcs = 75,000 (15,000 * 5)
        // Extra = 75,000 * (1.2 - 1) = 15,000
        checkDecimal(sizeMult?.amount || 0, '15000');

        // Total check
        // 75000 + 30000 + 15000 = 120000
        checkDecimal(result.total, '120000');
    });

    /**
     * Test Case 5: DTF 2.5 meters
     * Expected: Per-meter calculation (65,000 * 2.5 = 162,500)
     */
    it('should calculate DTF per-meter pricing', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 1,
            printing: {
                method: 'dtf',
                lengthMeter: 2.5
            },
            currency: 'IDR'
        });

        // Should have per-meter cost
        const perMeter = result.breakdown.find(b => b.code === 'PER_METER');
        expect(perMeter).toBeDefined();

        // 65,000 * 2.5 = 162,500
        checkDecimal(perMeter?.amount || 0, '162500');
    });

    /**
     * Test Case 6: Bulk tier 50+ pcs
     * Expected: 12,000 per unit
     * Total: 50 * 12,000 = 600,000
     */
    it('should apply correct bulk tier for qty 50', async () => {
        const result = await calculatePrice({
            variantId: testVariantId,
            qty: 50,
            currency: 'IDR'
        });

        const bulkTier = result.breakdown.find(b => b.code === 'BULK_TIER');
        expect(bulkTier).toBeDefined();

        if (bulkTier && bulkTier.unit) {
            checkDecimal(bulkTier.unit, '12000');
        }

        checkDecimal(result.total, '600000');
    });
});
