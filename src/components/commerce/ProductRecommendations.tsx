'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Product {
    id: string;
    slug: string;
    name: string;
    category: string;
    price: number;
    description: string;
    image?: string;
    inStock: boolean;
}

interface ProductRecommendationsProps {
    products: Product[];
    title?: string;
}

export default function ProductRecommendations({
    products,
    title = "Produk Serupa Yang Mungkin Anda Suka"
}: ProductRecommendationsProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                {/* Section Header */}
                <div className="mb-12 space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">
                            Rekomendasi
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[#2D3A2D] leading-tight">
                        {title}
                    </h2>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/rasa-ibu/products/${product.slug}`}
                            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Product Image */}
                            <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-5xl">🍽️</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-5 space-y-2">
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                                    {product.category}
                                </span>
                                <h3 className="text-lg font-black text-[#2D3A2D] group-hover:text-amber-600 transition-colors line-clamp-2">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between pt-3">
                                    <div>
                                        <p className="text-xl font-black text-[#2D3A2D]">
                                            Rp {product.price.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    {product.inStock ? (
                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                                            Tersedia
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                                            Habis
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
