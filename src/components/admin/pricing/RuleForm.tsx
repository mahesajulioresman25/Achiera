'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PriceScope } from '@prisma/client';

interface RuleFormProps {
    initialData?: any;
    brandSlug: string;
}

export default function RuleForm({ initialData, brandSlug }: RuleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [components, setComponents] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        componentId: initialData?.componentId || '',
        scope: initialData?.scope || 'GLOBAL',
        scopeId: initialData?.scopeId || '',
        amount: initialData?.amount || 0,
        currency: 'IDR',
        priority: initialData?.priority || 0,
        minQty: initialData?.minQty || '',
        maxQty: initialData?.maxQty || '',
        metadata: initialData?.metadata ? Object.entries(initialData.metadata).map(([k, v]) => ({ key: k, value: v })) : []
    });

    const [scopeOptions, setScopeOptions] = useState<any[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        // Fetch components for dropdown
        fetch('/api/admin/pricing/components')
            .then(res => res.json())
            .then(data => setComponents(data));
    }, []);

    // Fetch scope options when scope changes
    useEffect(() => {
        if (formData.scope === 'PRODUCT' || formData.scope === 'VARIANT') {
            setLoadingOptions(true);
            const query = new URLSearchParams({ scope: formData.scope });
            if (brandSlug) query.append('brandSlug', brandSlug);

            fetch(`/api/admin/pricing/scope-options?${query.toString()}`)
                .then(res => res.json())
                .then(data => {
                    setScopeOptions(Array.isArray(data) ? data : []);
                })
                .catch(err => console.error("Failed to fetch options", err))
                .finally(() => setLoadingOptions(false));
        } else {
            setScopeOptions([]);
        }
    }, [formData.scope, brandSlug]);

    const handleAddMetadata = () => {
        setFormData(prev => ({
            ...prev,
            metadata: [...prev.metadata, { key: '', value: '' }]
        }));
    };

    const handleRemoveMetadata = (index: number) => {
        setFormData(prev => ({
            ...prev,
            metadata: prev.metadata.filter((_, i) => i !== index)
        }));
    };

    const handleMetadataChange = (index: number, field: 'key' | 'value', val: string) => {
        const newMeta = [...formData.metadata];
        // @ts-ignore
        newMeta[index][field] = val;
        setFormData({ ...formData, metadata: newMeta });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Convert metadata array back to object
            const metadataObj: any = {};
            formData.metadata.forEach((item: any) => {
                if (item.key) metadataObj[item.key] = item.value; // Simple string values for now
            });

            const payload = {
                ...formData,
                amount: Number(formData.amount),
                priority: Number(formData.priority),
                minQty: formData.minQty ? Number(formData.minQty) : null,
                maxQty: formData.maxQty ? Number(formData.maxQty) : null,
                metadata: metadataObj
            };

            const url = initialData
                ? `/api/admin/pricing/rules/${initialData.id}`
                : '/api/admin/pricing/rules';

            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push(`/dashboard/${brandSlug}/pricing/rules`);
                router.refresh();
            }
        } catch (error) {
            console.error('Save error', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                <h2 className="text-lg font-bold text-stone-900">
                    {initialData ? 'Edit Rule' : 'New Pricing Rule'}
                </h2>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" /> Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Pricing Component</label>
                        <select
                            required
                            value={formData.componentId}
                            onChange={e => setFormData({ ...formData, componentId: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            <option value="">Select a component...</option>
                            {components.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Amount</label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value as any })}
                                className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Priority</label>
                            <input
                                type="number"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <p className="text-xs text-stone-400 mt-1">Higher runs last</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Scope</label>
                        <select
                            value={formData.scope}
                            onChange={e => setFormData({ ...formData, scope: e.target.value as any, scopeId: '' })}
                            className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            <option value="GLOBAL">Global (All Products)</option>
                            <option value="BRAND">Brand</option>
                            <option value="PRODUCT">Product</option>
                            <option value="VARIANT">Variant</option>
                        </select>
                    </div>

                    {formData.scope !== 'GLOBAL' && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Scope ID</label>
                            {(formData.scope === 'PRODUCT' || formData.scope === 'VARIANT') ? (
                                <select
                                    value={formData.scopeId}
                                    onChange={e => setFormData({ ...formData, scopeId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                    disabled={loadingOptions}
                                >
                                    <option value="">
                                        {loadingOptions ? 'Loading...' : `Select ${formData.scope.toLowerCase()}...`}
                                    </option>
                                    {scopeOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={`Enter ${formData.scope} ID`}
                                    value={formData.scopeId}
                                    onChange={e => setFormData({ ...formData, scopeId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Conditions */}
                <div className="space-y-6 bg-stone-50 p-6 rounded-xl">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Conditions</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Min Qty</label>
                            <input
                                type="number"
                                value={formData.minQty}
                                onChange={e => setFormData({ ...formData, minQty: e.target.value })}
                                placeholder="None"
                                className="w-full p-2 rounded border border-stone-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Max Qty</label>
                            <input
                                type="number"
                                value={formData.maxQty}
                                onChange={e => setFormData({ ...formData, maxQty: e.target.value })}
                                placeholder="None"
                                className="w-full p-2 rounded border border-stone-200"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-stone-500">Metadata Matchers</label>
                            <button type="button" onClick={handleAddMetadata} className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {formData.metadata.map((meta: any, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Key (e.g. printMethod)"
                                        value={meta.key}
                                        onChange={e => handleMetadataChange(idx, 'key', e.target.value)}
                                        className="flex-1 p-2 rounded border border-stone-200 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value (e.g. dtf)"
                                        value={meta.value}
                                        onChange={e => handleMetadataChange(idx, 'value', e.target.value)}
                                        className="flex-1 p-2 rounded border border-stone-200 text-sm"
                                    />
                                    <button type="button" onClick={() => handleRemoveMetadata(idx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {formData.metadata.length === 0 && (
                                <p className="text-xs text-stone-400 italic text-center py-2">No metadata conditions</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {initialData ? 'Update Rule' : 'Create Rule'}
                </button>
            </div>
        </form>
    );
}
