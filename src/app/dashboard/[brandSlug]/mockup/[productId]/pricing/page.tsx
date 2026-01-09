'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProductPricingPage({ params }: { params: Promise<{ brandSlug: string; productId: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug, productId } = resolvedParams;
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [pricing, setPricing] = useState<Record<string, { basePrice: string; bulkTiers: Array<{ minQty: string; maxQty: string; price: string }> }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProductData();
    }, [productId]);

    const fetchProductData = async () => {
        setIsLoading(true);
        try {
            // Fetch product with variants
            const res = await fetch(`/api/admin/mockup-templates/${productId}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
                setVariants(data.variants || []);

                // Initialize pricing state
                const initialPricing: any = {};
                for (const variant of data.variants || []) {
                    initialPricing[variant.id] = {
                        basePrice: variant.price?.toString() || '0',
                        bulkTiers: []
                    };
                }
                setPricing(initialPricing);

                // Fetch existing pricing rules
                await fetchExistingRules(data.variants || []);
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            setError('Failed to load product data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExistingRules = async (variants: any[]) => {
        try {
            const res = await fetch('/api/admin/pricing/rules');
            if (res.ok) {
                const rules = await res.json();

                const updatedPricing = { ...pricing };
                for (const variant of variants) {
                    // Find rules for this variant
                    const variantRules = rules.filter((r: any) =>
                        r.scope === 'VARIANT' && r.scopeId === variant.id
                    );

                    const bulkRules = variantRules.filter((r: any) =>
                        r.component.code === 'BULK_TIER'
                    ).sort((a: any, b: any) => (a.minQty || 0) - (b.minQty || 0));

                    updatedPricing[variant.id] = {
                        basePrice: variant.price?.toString() || '0',
                        bulkTiers: bulkRules.map((r: any) => ({
                            minQty: r.minQty?.toString() || '',
                            maxQty: r.maxQty?.toString() || '',
                            price: r.amount?.toString() || ''
                        }))
                    };
                }
                setPricing(updatedPricing);
            }
        } catch (error) {
            console.error('Failed to fetch pricing rules:', error);
        }
    };

    const handleAddBulkTier = (variantId: string) => {
        setPricing(prev => ({
            ...prev,
            [variantId]: {
                ...prev[variantId],
                bulkTiers: [
                    ...prev[variantId].bulkTiers,
                    { minQty: '', maxQty: '', price: '' }
                ]
            }
        }));
    };

    const handleRemoveBulkTier = (variantId: string, index: number) => {
        setPricing(prev => ({
            ...prev,
            [variantId]: {
                ...prev[variantId],
                bulkTiers: prev[variantId].bulkTiers.filter((_, i) => i !== index)
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // Get BASE_UNIT and BULK_TIER components
            const componentsRes = await fetch('/api/admin/pricing/components');
            const components = await componentsRes.json();

            const baseUnitComponent = components.find((c: any) => c.code === 'BASE_UNIT');
            const bulkTierComponent = components.find((c: any) => c.code === 'BULK_TIER');

            if (!baseUnitComponent || !bulkTierComponent) {
                throw new Error('Required pricing components not found. Please run seed-pricing.ts first.');
            }

            // Save pricing for each variant
            for (const variant of variants) {
                const variantPricing = pricing[variant.id];
                if (!variantPricing) continue;

                // 1. Update variant base price in database
                await fetch(`/api/admin/mockup-variants/${variant.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        price: Number(variantPricing.basePrice)
                    })
                });

                // 2. Delete existing VARIANT-level rules for this variant
                const existingRulesRes = await fetch('/api/admin/pricing/rules');
                const existingRules = await existingRulesRes.json();

                const variantRules = existingRules.filter((r: any) =>
                    r.scope === 'VARIANT' && r.scopeId === variant.id
                );

                for (const rule of variantRules) {
                    await fetch(`/api/admin/pricing/rules/${rule.id}`, {
                        method: 'DELETE'
                    });
                }

                // 3. Create new BASE_UNIT rule for variant
                await fetch('/api/admin/pricing/rules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        componentId: baseUnitComponent.id,
                        scope: 'VARIANT',
                        scopeId: variant.id,
                        priority: 100,
                        currency: 'IDR',
                        amount: Number(variantPricing.basePrice),
                        isActive: true
                    })
                });

                // 4. Create BULK_TIER rules
                for (const tier of variantPricing.bulkTiers) {
                    if (!tier.minQty || !tier.price) continue;

                    await fetch('/api/admin/pricing/rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            componentId: bulkTierComponent.id,
                            scope: 'VARIANT',
                            scopeId: variant.id,
                            priority: 110,
                            currency: 'IDR',
                            amount: Number(tier.price),
                            minQty: Number(tier.minQty),
                            maxQty: tier.maxQty ? Number(tier.maxQty) : null,
                            isActive: true
                        })
                    });
                }
            }

            setSuccess('Pricing saved successfully!');
            setTimeout(() => {
                router.push(`/dashboard/${brandSlug}/mockup`);
            }, 1500);
        } catch (error: any) {
            setError(error.message || 'Failed to save pricing');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/${brandSlug}/mockup`}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Configure Pricing</h1>
                    <p className="text-stone-600 text-sm">{product?.displayName}</p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {success}
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {error}
                </div>
            )}

            {/* Variants Pricing */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-stone-900 mb-1">Variant-Specific Pricing</h3>
                <p className="text-sm text-stone-600">
                    Each variant can have different pricing. Configure base price and optional bulk tier discounts for each variant below.
                </p>
            </div>

            <div className="space-y-4">
                {variants.map((variant) => (
                    <div key={variant.id} className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-stone-900">{variant.name}</h3>
                        </div>

                        {/* Base Price */}
                        <div>
                            <label className="block text-sm font-bold text-stone-900 mb-2">
                                Base Price (per unit)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">Rp</span>
                                <input
                                    type="number"
                                    value={pricing[variant.id]?.basePrice || ''}
                                    onChange={(e) => setPricing(prev => ({
                                        ...prev,
                                        [variant.id]: {
                                            ...prev[variant.id],
                                            basePrice: e.target.value
                                        }
                                    }))}
                                    className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="15000"
                                />
                            </div>
                        </div>

                        {/* Bulk Tiers */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-bold text-stone-900">
                                    Bulk Tier Pricing (Optional)
                                </label>
                                <button
                                    onClick={() => handleAddBulkTier(variant.id)}
                                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                >
                                    + Add Tier
                                </button>
                            </div>

                            {pricing[variant.id]?.bulkTiers.map((tier, index) => (
                                <div key={index} className="grid grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs text-stone-600 mb-1">Min Qty</label>
                                        <input
                                            type="number"
                                            value={tier.minQty}
                                            onChange={(e) => {
                                                const newTiers = [...pricing[variant.id].bulkTiers];
                                                newTiers[index].minQty = e.target.value;
                                                setPricing(prev => ({
                                                    ...prev,
                                                    [variant.id]: { ...prev[variant.id], bulkTiers: newTiers }
                                                }));
                                            }}
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                                            placeholder="10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-stone-600 mb-1">Max Qty</label>
                                        <input
                                            type="number"
                                            value={tier.maxQty}
                                            onChange={(e) => {
                                                const newTiers = [...pricing[variant.id].bulkTiers];
                                                newTiers[index].maxQty = e.target.value;
                                                setPricing(prev => ({
                                                    ...prev,
                                                    [variant.id]: { ...prev[variant.id], bulkTiers: newTiers }
                                                }));
                                            }}
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                                            placeholder="49"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-stone-600 mb-1">Price</label>
                                            <input
                                                type="number"
                                                value={tier.price}
                                                onChange={(e) => {
                                                    const newTiers = [...pricing[variant.id].bulkTiers];
                                                    newTiers[index].price = e.target.value;
                                                    setPricing(prev => ({
                                                        ...prev,
                                                        [variant.id]: { ...prev[variant.id], bulkTiers: newTiers }
                                                    }));
                                                }}
                                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                                                placeholder="13500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBulkTier(variant.id, index)}
                                            className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {pricing[variant.id]?.bulkTiers.length === 0 && (
                                <p className="text-sm text-stone-500 italic">
                                    No bulk tiers. Click "+ Add Tier" to add quantity-based discounts.
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-4 border-t border-stone-200">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                    {isSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Pricing</>
                    )}
                </button>
                <Link
                    href={`/dashboard/${brandSlug}/mockup`}
                    className="px-6 py-3 text-stone-600 hover:text-stone-900 font-medium"
                >
                    Cancel
                </Link>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>💡 Tip:</strong> Bulk tiers allow you to offer discounts for larger quantities.
                For example: 1-9 pcs = Rp 15,000, 10-49 pcs = Rp 13,500, 50+ pcs = Rp 12,000.
            </div>
        </div>
    );
}
