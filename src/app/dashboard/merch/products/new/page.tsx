
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadField from '@/components/admin/ImageUploadField';

interface Collection {
    id: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        basePrice: '',
        collectionId: '',
        description: '',
        baseImage: ''
    });

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const res = await fetch('/api/public/merch/collections');
            if (res.ok) {
                const data = await res.json();
                setCollections(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, collectionId: data[0].id }));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load collections');
        } finally {
            setIsLoadingCollections(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.collectionId || !formData.sku) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/merch/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create product');

            const newProduct = await res.json();
            toast.success('Product created successfully');

            // Redirect to edit page for advanced settings (variants, etc.)
            router.push(`/dashboard/merch/products/${newProduct.id}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-stone-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/merch/products"
                    className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">New Product</h1>
                    <p className="text-stone-500">Add a new item to your merchandise catalog</p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Product Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Premium Cotton T-Shirt"
                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    SKU <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="e.g., TS-001"
                                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Collection <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.collectionId}
                                    onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    disabled={isLoadingCollections}
                                    required
                                >
                                    <option value="" disabled>Select Collection</option>
                                    {collections.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Base Price (IDR)
                            </label>
                            <input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                placeholder="0"
                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Base Image
                            </label>
                            <ImageUploadField
                                value={formData.baseImage}
                                onChange={(url) => setFormData({ ...formData, baseImage: url })}
                                label="Upload Image"
                                description="Product main image"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                        <Link
                            href="/dashboard/merch/products"
                            className="px-6 py-2.5 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-bold shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Product
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
