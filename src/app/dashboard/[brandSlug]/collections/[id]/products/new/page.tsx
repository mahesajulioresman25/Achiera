'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function NewProductPage({
    params
}: {
    params: Promise<{ brandSlug: string; id: string }>;
}) {
    const { brandSlug, id: collectionId } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sku: '',
        productType: 'tote-bag',
        description: '',
        baseImage: '',
        isCustomizable: true,
        isFeatured: false,
        status: 'active'
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, baseImage: data.url }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/collections/${collectionId}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const product = await res.json();
                toast.success('Product created successfully!');
                router.push(`/dashboard/${brandSlug}/products/${product.id}`);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Failed to create product');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/${brandSlug}/collections/${collectionId}`}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Create New Product</h1>
                    <p className="text-stone-600 mt-1">Add a new product to your collection</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                {/* Product Name */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Product Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        placeholder="e.g., Canvas Tote Bag A4"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Slug *
                    </label>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                        placeholder="canvas-tote-bag-a4"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-stone-500 mt-1">
                        URL-friendly version of the name
                    </p>
                </div>

                {/* SKU */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        SKU (Optional)
                    </label>
                    <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="TB-A4-001"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>

                {/* Product Type */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Product Type *
                    </label>
                    <select
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                        <option value="tote-bag">Tote Bag</option>
                        <option value="t-shirt">T-Shirt</option>
                        <option value="hoodie">Hoodie</option>
                        <option value="tumbler">Tumbler</option>
                        <option value="mug">Mug</option>
                        <option value="cap">Cap</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Describe your product..."
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>

                {/* Base Image URL */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Base Image
                    </label>

                    <div className="space-y-3">
                        {/* Preview & Upload Area */}
                        <div className="flex gap-4 items-start">
                            <div className="w-32 h-32 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
                                {formData.baseImage ? (
                                    <>
                                        <img
                                            src={formData.baseImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, baseImage: '' })}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-stone-400 text-xs text-center p-2">
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <label className="block w-full">
                                    <span className="sr-only">Choose file</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                        className="block w-full text-sm text-stone-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-amber-50 file:text-amber-700
                                            hover:file:bg-amber-100
                                            cursor-pointer"
                                    />
                                </label>
                                {isUploading && <p className="text-sm text-amber-600 mt-2 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}

                                <div className="mt-3">
                                    <input
                                        type="text"
                                        value={formData.baseImage}
                                        onChange={(e) => setFormData({ ...formData, baseImage: e.target.value })}
                                        placeholder="Or enter image URL..."
                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <p className="text-xs text-stone-500 mt-1">
                                    Upload from computer or paste a URL.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isCustomizable"
                            checked={formData.isCustomizable}
                            onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                            className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isCustomizable" className="text-sm font-medium text-stone-700">
                            Allow customization (mockup builder)
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isFeatured" className="text-sm font-medium text-stone-700">
                            Mark as featured product
                        </label>
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
                                Create Product
                            </>
                        )}
                    </button>
                    <Link
                        href={`/dashboard/${brandSlug}/collections/${collectionId}`}
                        className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
