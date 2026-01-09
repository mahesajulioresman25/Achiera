'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Settings, Eye, Layers, Loader2, Save, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import MockupTemplateEditor from '@/components/admin/MockupTemplateEditor';
import ImageUploadField from '@/components/admin/ImageUploadField';

type Tab = 'details' | 'variants' | 'print-setup' | 'preview';

export default function ProductDetailPage({
    params
}: {
    params: Promise<{ brandSlug: string; id: string }>;
}) {
    const { brandSlug, id } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        productType: '',
        baseImage: '',
        isCustomizable: true,
        isFeatured: false,
        status: 'active'
    });

    useEffect(() => {
        // Check for 'tab' query param
        const searchParams = new URLSearchParams(window.location.search);
        const tab = searchParams.get('tab');
        if (tab && ['details', 'variants', 'print-setup', 'preview'].includes(tab)) {
            setActiveTab(tab as Tab);
        }

        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    productType: data.productType,
                    baseImage: data.baseImage || '',
                    isCustomizable: data.isCustomizable,
                    isFeatured: data.isFeatured,
                    status: data.status
                });
            } else {
                toast.error('Failed to load product');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Product updated successfully');
                setEditing(false);
                fetchProduct();
            } else {
                toast.error('Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product');
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

    if (!product) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center py-16">
                    <p className="text-stone-600">Product not found</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'details' as Tab, label: 'Details', icon: Package },
        { id: 'variants' as Tab, label: 'Variants', icon: Layers },
        { id: 'print-setup' as Tab, label: 'Print Setup', icon: Settings },
        { id: 'preview' as Tab, label: 'Preview', icon: Eye }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/${brandSlug}/collections/${product.collectionId}`}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-stone-900">{product.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-stone-100 text-stone-700'
                            }`}>
                            {product.status}
                        </span>
                    </div>
                    <p className="text-stone-600 mt-1">
                        {product.collection?.name} → {product.productType}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-stone-200 mb-6">
                <div className="border-b border-stone-200">
                    <div className="flex gap-1 p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-amber-100 text-amber-700 font-medium'
                                        : 'text-stone-600 hover:bg-stone-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-stone-900">Product Details</h2>
                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditing(false);
                                                setFormData({
                                                    name: product.name,
                                                    description: product.description || '',
                                                    productType: product.productType,
                                                    baseImage: product.baseImage || '',
                                                    isCustomizable: product.isCustomizable,
                                                    isFeatured: product.isFeatured,
                                                    status: product.status
                                                });
                                            }}
                                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {editing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">
                                            Product Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">
                                            Base Image URL
                                        </label>
                                        <ImageUploadField
                                            value={formData.baseImage}
                                            onChange={(url) => setFormData({ ...formData, baseImage: url })}
                                            label="Base Image"
                                            description="Upload product base image (no design)"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isCustomizable"
                                            checked={formData.isCustomizable}
                                            onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                                            className="w-4 h-4 text-amber-600 border-stone-300 rounded"
                                        />
                                        <label htmlFor="isCustomizable" className="text-sm font-medium text-stone-700">
                                            Allow customization
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            className="w-4 h-4 text-amber-600 border-stone-300 rounded"
                                        />
                                        <label htmlFor="isFeatured" className="text-sm font-medium text-stone-700">
                                            Featured product
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-stone-600 mb-2">Product Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-stone-500">SKU</p>
                                                <p className="text-sm font-medium text-stone-900">{product.sku || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500">Product Type</p>
                                                <p className="text-sm font-medium text-stone-900">{product.productType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500">Description</p>
                                                <p className="text-sm text-stone-900">{product.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-stone-600 mb-2">Settings</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-stone-500">Customizable</p>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {product.isCustomizable ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500">Featured</p>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {product.isFeatured ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500">Variants</p>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {product._count.variants} variants
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {product.baseImage && !editing && (
                                <div>
                                    <h3 className="text-sm font-medium text-stone-600 mb-2">Base Image</h3>
                                    <div className="w-64 h-64 bg-stone-100 rounded-lg overflow-hidden">
                                        <img
                                            src={product.baseImage}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-stone-900">Product Variants</h2>
                                <Link
                                    href={`/dashboard/${brandSlug}/products/${id}/variants/new`}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    <Package className="w-4 h-4" />
                                    Add Variant
                                </Link>
                            </div>

                            {product.variants.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg">
                                    <Layers className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-stone-900 mb-2">
                                        No Variants Yet
                                    </h3>
                                    <p className="text-stone-600 mb-4">
                                        Create variants for different sizes, materials, or printing methods
                                    </p>
                                    <Link
                                        href={`/dashboard/${brandSlug}/products/${id}/variants/new`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                    >
                                        <Package className="w-4 h-4" />
                                        Add Variant
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {product.variants.map((variant: any) => (
                                        <div
                                            key={variant.id}
                                            className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-stone-900 mb-1">{variant.name}</h3>
                                                    <p className="text-sm text-stone-600 mb-2">SKU: {variant.sku}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(variant.attributes as Record<string, any>).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs"
                                                            >
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-stone-900">
                                                        Rp {Number(variant.basePrice).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-stone-600">{variant.stockStatus}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'print-setup' && (
                        <div>
                            <MockupTemplateEditor
                                productId={id}
                                brandSlug={brandSlug}
                            />
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div>
                            <h2 className="text-xl font-bold text-stone-900 mb-4">Public Preview</h2>
                            <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg">
                                <Eye className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                                    Preview Coming Soon
                                </h3>
                                <p className="text-stone-600">
                                    See how this product appears to customers
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
