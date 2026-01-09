'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function CollectionsPage({
    params
}: {
    params: Promise<{ brandSlug: string }>;
}) {
    const { brandSlug } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCollections();
    }, [brandSlug]);

    const fetchCollections = async () => {
        try {
            const res = await fetch(`/api/admin/collections?brandSlug=${brandSlug}`);
            if (res.ok) {
                const data = await res.json();
                setCollections(data);
            } else {
                toast.error('Failed to load collections');
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
            toast.error('Failed to load collections');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;

        try {
            const res = await fetch(`/api/admin/collections/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Collection deleted successfully');
                fetchCollections();
            } else {
                toast.error('Failed to delete collection');
            }
        } catch (error) {
            console.error('Error deleting collection:', error);
            toast.error('Failed to delete collection');
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Collections</h1>
                    <p className="text-stone-600 mt-1">
                        Manage your product collections and showcase
                    </p>
                </div>
                <Link
                    href={`/dashboard/${brandSlug}/collections/new`}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Collection
                </Link>
            </div>

            {/* Collections Grid */}
            {collections.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-stone-300">
                    <Package className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">
                        No Collections Yet
                    </h3>
                    <p className="text-stone-600 mb-6">
                        Create your first collection to start organizing products
                    </p>
                    <Link
                        href={`/dashboard/${brandSlug}/collections/new`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Collection
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Cover Image */}
                            {collection.coverImage ? (
                                <div className="h-48 bg-stone-100">
                                    <img
                                        src={collection.coverImage}
                                        alt={collection.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                    <Package className="w-16 h-16 text-amber-600" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-stone-900 mb-1">
                                            {collection.name}
                                        </h3>
                                        <p className="text-sm text-stone-600 line-clamp-2">
                                            {collection.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                                    <div className="flex items-center gap-1">
                                        <Package className="w-4 h-4" />
                                        <span>{collection._count.products} products</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${collection.visibility === 'published'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-stone-100 text-stone-700'
                                        }`}>
                                        {collection.visibility}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/dashboard/${brandSlug}/collections/${collection.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </Link>
                                    <Link
                                        href={`/dashboard/${brandSlug}/collections/${collection.id}/edit`}
                                        className="flex items-center justify-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(collection.id)}
                                        className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
