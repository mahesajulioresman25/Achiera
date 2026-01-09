'use client';

import { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
    product: any;
    collectionSlug: string;
    onCustomize?: (productId: string, variantId: string) => void;
}

export default function ProductCard({ product, collectionSlug, onCustomize }: ProductCardProps) {
    const prices = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;

        const priceValues = product.variants.map((v: any) => v.basePrice);
        const minPrice = Math.min(...priceValues);
        const maxPrice = Math.max(...priceValues);

        return { min: minPrice, max: maxPrice };
    }, [product]);

    const showcaseImage = product.baseImage;
    const productName = product.name;
    const description = product.description;
    // For now we don't have public product detail page, so we might want to just show customize button
    // or maybe link to a modal.

    // Pick the first variant as default for customization
    const defaultVariantId = product.variants?.[0]?.id;

    const handleCustomizeClick = () => {
        if (onCustomize && defaultVariantId) {
            onCustomize(product.id, defaultVariantId);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            {/* Image */}
            <div className="aspect-square bg-stone-100 relative overflow-hidden">
                {showcaseImage ? (
                    <img
                        src={showcaseImage}
                        alt={productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-stone-300" />
                    </div>
                )}

                {/* Featured Badge */}
                {product.isFeatured && (
                    <div className="absolute top-3 right-3 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        FEATURED
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-bold text-lg text-stone-900 mb-2 line-clamp-1">
                    {productName}
                </h3>

                {description && (
                    <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Price */}
                <div className="mb-4">
                    {prices ? (
                        <div>
                            {product.flashSale ? (
                                <>
                                    <p className="text-xs text-stone-500">Flash Sale Price</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-stone-400 line-through">
                                            Rp {Number(prices.min).toLocaleString('id-ID')}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">
                                            -{product.flashSale.discount}%
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">
                                        Rp {Number(product.flashSale.discountedPrice).toLocaleString('id-ID')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-stone-500">Starting from</p>
                                    <p className="text-2xl font-bold text-amber-600">
                                        Rp {Number(prices.min).toLocaleString('id-ID')}
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-stone-400">Price not available</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {product.isCustomizable ? (
                        <button
                            onClick={handleCustomizeClick}
                            disabled={!defaultVariantId}
                            className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Customize
                        </button>
                    ) : (
                        <button
                            disabled
                            className="flex-1 bg-stone-100 text-stone-400 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                        >
                            Not Customizable
                        </button>
                    )}

                    {/* Placeholder for Details button if we decide to add product detail page later */}
                    {/* <Link
                        href={`/products/${product.id}`}
                        className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                    >
                        Details
                    </Link> */}
                </div>
            </div>
        </div>
    );
}
