'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Star } from 'lucide-react';
import PromoBadge from './PromoBadge';
import ProductWishlistButton from './ProductWishlistButton';
import { useSession } from 'next-auth/react';

interface Product {
    id: string;
    slug: string;
    name: string;
    category: string;
    price: number;
    description: string;
    image?: string;
    orderCount?: number;
    totalStock?: number;
    rating?: number;
    reviewCount?: number;
}

interface BestSellersSectionProps {
    products: Product[];
    activeFlashSale?: any;
}

export default function BestSellersSection({ products, activeFlashSale }: BestSellersSectionProps) {
    const { data: session } = useSession();
    // Helper to calculate product price with flash sale
    const getProductPrice = (product: Product) => {
        const basePrice = product.price;
        // ONLY apply discount if it is ACTIVE
        if (!activeFlashSale || activeFlashSale.status !== 'ACTIVE') return { base: basePrice, discount: 0, final: basePrice };

        // Check if targeted
        let isEligible = activeFlashSale.targetType === 'ALL';
        if (activeFlashSale.targetType === 'SPECIFIC' && activeFlashSale.targetItems) {
            isEligible = activeFlashSale.targetItems.includes(product.id);
        }

        if (isEligible) {
            const discountAmount = basePrice * (activeFlashSale.discountPercentage / 100);
            return {
                base: basePrice,
                discount: activeFlashSale.discountPercentage,
                final: basePrice - discountAmount
            };
        }

        return { base: basePrice, discount: 0, final: basePrice };
    };
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="py-20 bg-gradient-to-b from-white to-amber-50/30">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                            Paling Laris
                        </span>
                        <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D3A2D] leading-tight">
                        Sajian Paling<br />
                        <span className="text-amber-600">Disukai Ibu</span>
                    </h2>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Dipilih oleh ribuan keluarga. Rasa yang sudah terbukti membawa kehangatan ke meja makan.
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/rasa-ibu/products/${product.slug}`}
                            className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className="relative aspect-square overflow-hidden">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-stone-50">
                                        <span className="text-6xl">🍽️</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Top Right Badges */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10 transition-transform group-hover:scale-110">
                                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black tracking-widest text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                    <Star className="w-3 h-3 text-amber-500 fill-current" /> {(product.rating || 0).toFixed(1)}
                                </div>
                                <ProductWishlistButton productId={product.id} productName={product.name} />
                            </div>

                            {/* Promo / Flash Sale Badge */}
                            {getProductPrice(product).discount > 0 ? (
                                <PromoBadge type="FLASH_SALE" className="top-4 left-4" />
                            ) : index < 3 ? (
                                <PromoBadge type="BEST_SELLER" text={`#${index + 1} Terlaris`} className="top-4 left-4" />
                            ) : null}
                            {/* Product Info */}
                            <div className="p-6 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                                        {product.category}
                                    </span>
                                </div>
                                <h3 className="text-sm md:text-xl font-black text-[#2D3A2D] group-hover:text-amber-600 transition-colors line-clamp-1">
                                    {product.name}
                                </h3>
                                <p className="text-[10px] md:text-sm text-slate-600 line-clamp-2 leading-tight">
                                    {product.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div>
                                        {getProductPrice(product).discount > 0 ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-slate-400 line-through">
                                                        Rp {product.price.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">
                                                        -{getProductPrice(product).discount}%
                                                    </span>
                                                </div>
                                                <p className="text-lg md:text-2xl font-black text-amber-600">
                                                    Rp {getProductPrice(product).final.toLocaleString('id-ID')}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-lg md:text-2xl font-black text-[#2D3A2D]">
                                                Rp {product.price.toLocaleString('id-ID')}
                                            </p>
                                        )}
                                        <p className="text-[10px] md:text-xs text-slate-500">per porsi</p>
                                    </div>
                                    {product.inStock ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                                                Tersedia
                                            </span>
                                            {(product.totalStock || 0) > 0 && (product.totalStock || 0) < 15 && (
                                                <span className="text-[10px] font-black text-red-600 animate-pulse bg-red-50 px-2 py-0.5 rounded">
                                                    Stok Terbatas! ({product.totalStock})
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                                            Habis
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="absolute inset-0 border-4 border-amber-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </Link>
                    ))}
                </div>

                {/* View All Link */}
                <div className="text-center mt-12">
                    <Link
                        href="/rasa-ibu/products"
                        className="inline-block px-10 py-4 bg-[#2D3A2D] hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Lihat Semua Menu
                    </Link>
                </div>
            </div>
        </section>
    );
}
