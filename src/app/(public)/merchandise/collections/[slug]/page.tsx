'use client';

import React, { use, useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import PublicMockupModal from '@/components/PublicMockupModal';

export default function CollectionShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [collection, setCollection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ productId: string; variantId?: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            // Fetch collection info (includes products)
            const res = await fetch(`/api/public/collections/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setCollection(data);
            } else {
                console.error('Collection not found');
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomize = (productId: string, variantId: string) => {
        setSelectedProduct({ productId, variantId });
        setShowBuilder(true);
        // TODO: Redirect to product detail page or open modal
        // For now, let's just log it
        console.log('Customize product:', productId, variantId);
    };

    const handleCloseBuilder = () => {
        setShowBuilder(false);
        setSelectedProduct(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-stone-900 mb-4">Collection Not Found</h1>
                <Link
                    href="/merchandise"
                    className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Merchandise
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/merchandise"
                        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Back to Collections</span>
                    </Link>
                    <div className="text-stone-900 font-bold tracking-tight">
                        ACHIERA <span className="text-amber-600">MERCH</span>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bg-gradient-to-br from-amber-50 to-stone-50 border-b border-amber-100 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-amber-200">
                            COLLECTION
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 mb-4">
                            {collection.name}
                        </h1>
                        <p className="text-lg text-stone-600 leading-relaxed">
                            {collection.description || 'Explore our curated selection of premium merchandise'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Products Grid */}
            <main className="container mx-auto px-4 py-12">
                {collection.products && collection.products.length > 0 ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-stone-900 mb-2">
                                Products in this Collection
                            </h2>
                            <p className="text-stone-600">
                                Click "Customize" to start designing your own
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {collection.products.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    collectionSlug={slug}
                                    onCustomize={handleCustomize}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-stone-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-stone-700 mb-2">
                            No Products Yet
                        </h3>
                        <p className="text-stone-500">
                            Products will appear here once they're added to this collection
                        </p>
                    </div>
                )}
            </main>

            {/* Public Mockup Modal */}
            {showBuilder && selectedProduct && (
                <PublicMockupModal
                    isOpen={showBuilder}
                    onClose={handleCloseBuilder}
                    productId={selectedProduct.productId}
                    variantId={selectedProduct.variantId}
                />
            )}
        </div>
    );
}
