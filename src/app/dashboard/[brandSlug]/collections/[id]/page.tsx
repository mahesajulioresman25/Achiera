'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Package, Edit, Trash2, Loader2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function CollectionDetailPage({
    params
}: {
    params: Promise<{ brandSlug: string; id: string }>;
}) {
    const { brandSlug, id } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [collection, setCollection] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showProductModal, setShowProductModal] = useState(false);

    useEffect(() => {
        fetchCollection();
    }, [id]);

    const fetchCollection = async () => {
        try {
            const res = await fetch(`/api/admin/collections/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCollection(data);
            } else {
                toast.error('Failed to load collection');
            }
        } catch (error) {
            console.error('Error fetching collection:', error);
            toast.error('Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to remove this product from the collection?')) return;

        try {
            const res = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Product removed successfully');
                fetchCollection();
            } else {
                toast.error('Failed to remove product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to remove product');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center py-16">
                    <p className="text-stone-600">Collection not found</p>
                    <Link
                        href={`/dashboard/${brandSlug}/collections`}
                        className="text-amber-600 hover:underline mt-4 inline-block"
                    >
                        Back to Collections
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/${brandSlug}/collections`}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-stone-900">{collection.name}</h1>
                    <p className="text-stone-600 mt-1">{collection.description}</p>
                </div>
                <Link
                    href={`/dashboard/${brandSlug}/collections/${id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                    <Edit className="w-5 h-5" />
                    Edit Collection
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-600">Total Products</p>
                            <p className="text-2xl font-bold text-stone-900">
                                {collection._count.products}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-600">Visibility</p>
                            <p className="text-2xl font-bold text-stone-900 capitalize">
                                {collection.visibility}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-600">Status</p>
                            <p className="text-2xl font-bold text-stone-900 capitalize">
                                {collection.status}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-stone-900">Products</h2>
                    <Link
                        href={`/dashboard/${brandSlug}/collections/${id}/products/new`}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </Link>
                </div>

                {collection.products.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg">
                        <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-stone-900 mb-2">
                            No Products Yet
                        </h3>
                        <p className="text-stone-600 mb-4">
                            Add products to this collection to get started
                        </p>
                        <Link
                            href={`/dashboard/${brandSlug}/collections/${id}/products/new`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Product
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collection.products.map((product: any) => (
                            <div
                                key={product.id}
                                className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                {/* Product Image */}
                                {product.baseImage ? (
                                    <div className="h-32 bg-stone-100 rounded-lg mb-3">
                                        <img
                                            src={product.baseImage}
                                            alt={product.name}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-32 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg mb-3 flex items-center justify-center">
                                        <Package className="w-12 h-12 text-stone-400" />
                                    </div>
                                )}

                                {/* Product Info */}
                                <h3 className="font-bold text-stone-900 mb-1">{product.name}</h3>
                                <p className="text-sm text-stone-600 mb-2">{product.productType}</p>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                                    <span>{product._count.variants} variants</span>
                                    <span className={`px-2 py-1 rounded ${product.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-stone-100 text-stone-700'
                                        }`}>
                                        {product.status}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/dashboard/${brandSlug}/products/${product.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
