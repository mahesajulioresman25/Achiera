'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

export default function VariantPricingPage({ params }: { params: Promise<{ brandSlug: string; variantId: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug, variantId } = resolvedParams;
    const router = useRouter();

    const [variant, setVariant] = useState<any>(null);
    const [basePrice, setBasePrice] = useState('');
    const [bulkTiers, setBulkTiers] = useState<Array<{ minQty: string; maxQty: string; price: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchVariantData();
    }, [variantId]);

    const fetchVariantData = async () => {
        setIsLoading(true);
        try {
            // Fetch variant details
            const variantRes = await fetch(`/api/admin/mockup-variants/${variantId}`);
            if (variantRes.ok) {
                const variantData = await variantRes.json();
                setVariant(variantData);
                setBasePrice(variantData.price?.toString() || '0');

                // Fetch existing pricing rules for this variant
                const rulesRes = await fetch('/api/admin/pricing/rules');
                if (rulesRes.ok) {
                    const rules = await rulesRes.json();

                    const variantRules = rules.filter((r: any) =>
                        r.scope === 'VARIANT' && r.scopeId === variantId
                    );

                    const bulkRules = variantRules
                        .filter((r: any) => r.component.code === 'BULK_TIER')
                        .sort((a: any, b: any) => (a.minQty || 0) - (b.minQty || 0));

                    setBulkTiers(bulkRules.map((r: any) => ({
                        minQty: r.minQty?.toString() || '',
                        maxQty: r.maxQty?.toString() || '',
                        price: r.amount?.toString() || ''
                    })));
                }
            }
        } catch (error) {
            console.error('Failed to fetch variant:', error);
            setError('Failed to load variant data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBulkTier = () => {
        setBulkTiers([...bulkTiers, { minQty: '', maxQty: '', price: '' }]);
    };

    const handleRemoveBulkTier = (index: number) => {
        setBulkTiers(bulkTiers.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // Get components
            const componentsRes = await fetch('/api/admin/pricing/components');
            const components = await componentsRes.json();

            const baseUnitComponent = components.find((c: any) => c.code === 'BASE_UNIT');
            const bulkTierComponent = components.find((c: any) => c.code === 'BULK_TIER');

            if (!baseUnitComponent || !bulkTierComponent) {
                throw new Error('Required pricing components not found. Please run seed-pricing.ts first.');
            }

            // 1. Update variant base price
            await fetch(`/api/admin/mockup-variants/${variantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(basePrice) })
            });

            // 2. Delete existing VARIANT-level rules
            const existingRulesRes = await fetch('/api/admin/pricing/rules');
            const existingRules = await existingRulesRes.json();

            const variantRules = existingRules.filter((r: any) =>
                r.scope === 'VARIANT' && r.scopeId === variantId
            );

            for (const rule of variantRules) {
                await fetch(`/api/admin/pricing/rules/${rule.id}`, { method: 'DELETE' });
            }

            // 3. Create new BASE_UNIT rule
            await fetch('/api/admin/pricing/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    componentId: baseUnitComponent.id,
                    scope: 'VARIANT',
                    scopeId: variantId,
                    priority: 100,
                    currency: 'IDR',
                    amount: Number(basePrice),
                    isActive: true
                })
            });

            // 4. Create BULK_TIER rules
            for (const tier of bulkTiers) {
                if (!tier.minQty || !tier.price) continue;

                await fetch('/api/admin/pricing/rules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        componentId: bulkTierComponent.id,
                        scope: 'VARIANT',
                        scopeId: variantId,
                        priority: 110,
                        currency: 'IDR',
                        amount: Number(tier.price),
                        minQty: Number(tier.minQty),
                        maxQty: tier.maxQty ? Number(tier.maxQty) : null,
                        isActive: true
                    })
                });
            }

            setSuccess('Pricing saved successfully!');
            setTimeout(() => {
                window.history.back();
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
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Configure Pricing</h1>
                    <p className="text-stone-600 text-sm">{variant?.name}</p>
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

            {/* Pricing Form */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                    <Package className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-stone-900">Variant Pricing Configuration</h3>
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
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="15000"
                        />
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                        This is the default price for single unit purchases
                    </p>
                </div>

                {/* Bulk Tiers */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-stone-900">
                            Bulk Tier Pricing (Optional)
                        </label>
                        <button
                            onClick={handleAddBulkTier}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                            + Add Tier
                        </button>
                    </div>

                    {bulkTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <label className="block text-xs text-stone-600 mb-1">Min Qty</label>
                                <input
                                    type="number"
                                    value={tier.minQty}
                                    onChange={(e) => {
                                        const newTiers = [...bulkTiers];
                                        newTiers[index].minQty = e.target.value;
                                        setBulkTiers(newTiers);
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
                                        const newTiers = [...bulkTiers];
                                        newTiers[index].maxQty = e.target.value;
                                        setBulkTiers(newTiers);
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
                                            const newTiers = [...bulkTiers];
                                            newTiers[index].price = e.target.value;
                                            setBulkTiers(newTiers);
                                        }}
                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                                        placeholder="13500"
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveBulkTier(index)}
                                    className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}

                    {bulkTiers.length === 0 && (
                        <p className="text-sm text-stone-500 italic">
                            No bulk tiers. Click "+ Add Tier" to add quantity-based discounts.
                        </p>
                    )}
                </div>
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
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 text-stone-600 hover:text-stone-900 font-medium"
                >
                    Cancel
                </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mt-0.5">
                        i
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Pricing Configuration</p>
                        <p className="text-blue-700">
                            Set the base price for this variant and optionally add bulk tier discounts for volume purchases.
                            For example: 1-9 units at Rp 15,000, 10-49 units at Rp 13,500, 50+ units at Rp 12,000.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
