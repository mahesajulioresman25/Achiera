'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Heart, Loader2 } from 'lucide-react';
import { getWishlistProductsAction } from '@/lib/actions/commerce/wishlist';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';

export default function WishlistTab({ brandId }: { brandId: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchWishlist = async () => {
        setLoading(true);
        const res = await getWishlistProductsAction(brandId);
        if (res.success) {
            setProducts(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchWishlist();

        // Listen for wishlist updates to refresh this tab
        const handleUpdate = () => {
            startTransition(() => {
                fetchWishlist();
            });
        };

        window.addEventListener('wishlist-updated', handleUpdate);
        return () => window.removeEventListener('wishlist-updated', handleUpdate);
    }, [brandId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-[#8B7E66]">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium">Memuat menu favorit Bunda...</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-24 bg-[#F9F7F2] rounded-[3rem] border-2 border-dashed border-[#E5E1D8]">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Heart className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-[#2D3A2D] mb-2">Belum Ada Menu Favorit</h3>
                <p className="text-[#8B7E66] text-sm max-w-xs mx-auto mb-8">
                    Bunda belum menandai menu apapun sebagai favorit. Yuk, telusuri menu kasih kami!
                </p>
                <Link
                    href="/rasa-ibu/products"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#2D3A2D] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                >
                    Lihat Daftar Menu <ShoppingBag className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group bg-white rounded-[2.5rem] overflow-hidden border border-[#E5E1D8]/50 hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-500 flex flex-col h-full relative"
                >
                    {/* Image Section */}
                    <div className="aspect-square bg-[#FDFBF7] relative overflow-hidden">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#F9F7F2]">
                                <ShoppingBag className="w-12 h-12 text-[#E5E1D8]" />
                            </div>
                        )}

                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 text-amber-500 fill-current" /> {product.rating.toFixed(1)}
                            </div>
                            <ProductWishlistButton productId={product.id} productName={product.name} brandId={brandId} />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-[#F9F7F2] px-3 py-1 rounded-[10px] text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.1em]">
                                {product.category}
                            </div>
                            <span className="text-sm font-black text-[#2D3A2D] bg-[#F0EEE9] px-2 py-1 rounded-[10px]">
                                Rp {product.price.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <Link href={`/rasa-ibu/products/${product.slug}`} className="group-hover:text-[#B2BCA2] transition-colors">
                            <h3 className="text-lg font-black text-[#1A241A] mb-2 leading-tight line-clamp-2">
                                {product.name}
                            </h3>
                        </Link>

                        <div className="mt-auto pt-4 border-t border-[#F3F1ED]">
                            <AddToCartButton
                                product={product}
                                className="w-full bg-[#2D3A2D] hover:bg-[#1A241A] text-[#FDFBF7] py-3 rounded-xl font-black shadow-md transition-all flex items-center justify-center gap-2"
                                label="Pesan Ulang"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
