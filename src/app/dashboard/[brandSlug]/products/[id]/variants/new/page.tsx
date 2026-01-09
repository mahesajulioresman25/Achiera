'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function NewVariantPage({
    params
}: {
    params: Promise<{ brandSlug: string; id: string }>;
}) {
    const { brandSlug, id: productId } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        basePrice: '',
        stockStatus: 'in-stock',
        stockQuantity: '',
        attributes: [] as { key: string; value: string }[],
        weight: '',
        productionTime: '3-5 days'
    });

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${productId}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);

                // Pre-fill name and SKU base
                setFormData(prev => ({
                    ...prev,
                    name: `${data.name} - `,
                    sku: `${data.sku}-`
                }));
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
        const newAttributes = [...formData.attributes];
        newAttributes[index][field] = value;
        setFormData({ ...formData, attributes: newAttributes });
    };

    const addAttribute = () => {
        setFormData({
            ...formData,
            attributes: [...formData.attributes, { key: '', value: '' }]
        });
    };

    const removeAttribute = (index: number) => {
        const newAttributes = formData.attributes.filter((_, i) => i !== index);
        setFormData({ ...formData, attributes: newAttributes });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Convert attributes array to object
            const attributesObj = formData.attributes.reduce((acc, curr) => {
                if (curr.key && curr.value) {
                    acc[curr.key] = curr.value;
                }
                return acc;
            }, {} as Record<string, string>);

            const payload = {
                name: formData.name,
                sku: formData.sku,
                basePrice: parseFloat(formData.basePrice),
                stockStatus: formData.stockStatus,
                stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
                attributes: attributesObj,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                productionTime: formData.productionTime
            };

            const res = await fetch(`/api/admin/products/${productId}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Variant created successfully');
                router.push(`/dashboard/${brandSlug}/products/${productId}?tab=variants`);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to create variant');
            }
        } catch (error) {
            console.error('Error creating variant:', error);
            toast.error('Failed to create variant');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/${brandSlug}/products/${productId}`}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Add Variant</h1>
                    <p className="text-stone-600 mt-1">
                        Add a new variant for {product?.name}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-2">
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Variant Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., T-Shirt Size S White"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                SKU *
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                required
                                placeholder="e.g., TS-WHT-S"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-2">
                        Pricing & Inventory
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Base Price (Rp) *
                            </label>
                            <input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                required
                                min="0"
                                placeholder="100000"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Stock Status *
                            </label>
                            <select
                                value={formData.stockStatus}
                                onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="in-stock">In Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                                <option value="pre-order">Pre-Order</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Stock Quantity
                            </label>
                            <input
                                type="number"
                                value={formData.stockQuantity}
                                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                min="0"
                                placeholder="Optional"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Production Time
                            </label>
                            <input
                                type="text"
                                value={formData.productionTime}
                                onChange={(e) => setFormData({ ...formData, productionTime: e.target.value })}
                                placeholder="e.g., 3-5 days"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Attributes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <h2 className="text-lg font-bold text-stone-900">
                            Attributes
                        </h2>
                        <button
                            type="button"
                            onClick={addAttribute}
                            className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Attribute
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.attributes.map((attr, index) => (
                            <div key={index} className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                                        placeholder="Name (e.g. Size)"
                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                        placeholder="Value (e.g. XL)"
                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAttribute(index)}
                                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {formData.attributes.length === 0 && (
                            <p className="text-sm text-stone-500 italic">
                                Add attributes like Size, Color, or Material to specify this variant.
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-stone-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Variant
                            </>
                        )}
                    </button>
                    <Link
                        href={`/dashboard/${brandSlug}/products/${productId}`}
                        className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
