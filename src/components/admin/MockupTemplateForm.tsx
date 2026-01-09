
'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface MockupTemplateFormProps {
    initialData?: {
        id?: string;
        slug: string;
        displayName: string;
        productType: string;
        canvasWidth?: number;
        canvasHeight?: number;
        hasVariants?: boolean;
    };
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export default function MockupTemplateForm({ initialData, onSave, onCancel, isSaving }: MockupTemplateFormProps) {
    const [formData, setFormData] = useState({
        slug: '',
        displayName: '',
        productType: 'tumbler',
        canvasWidth: 2000,
        canvasHeight: 2000,
        hasVariants: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                slug: initialData.slug || '',
                displayName: initialData.displayName || '',
                productType: initialData.productType || 'tumbler',
                canvasWidth: initialData.canvasWidth || 2000,
                canvasHeight: initialData.canvasHeight || 2000,
                hasVariants: initialData.hasVariants ?? true,
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b pb-2">
                {initialData?.id ? 'Edit Template Details' : 'New Template Details'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Display Name</label>
                    <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="e.g. Tumbler 500ml"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Slug (ID)</label>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="e.g. tumbler-500ml"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Product Type</label>
                    <select
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                    >
                        <option value="tumbler">Tumbler</option>
                        <option value="hoodie">Hoodie</option>
                        <option value="tshirt">T-Shirt</option>
                        <option value="totebag">Tote Bag</option>
                        <option value="mug">Mug</option>
                        <option value="bag">Bag</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-stone-700">Canvas Width</label>
                        <input
                            type="number"
                            value={formData.canvasWidth}
                            onChange={(e) => setFormData({ ...formData, canvasWidth: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-stone-700">Canvas Height</label>
                        <input
                            type="number"
                            value={formData.canvasHeight}
                            onChange={(e) => setFormData({ ...formData, canvasHeight: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="hasVariants"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="hasVariants" className="text-sm font-medium text-stone-700">Has Color/Style Variants?</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                    {isSaving ? 'Saving...' : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Details
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
