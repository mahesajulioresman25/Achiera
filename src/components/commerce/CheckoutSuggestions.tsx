'use client';

import React, { useEffect, useState } from 'react';
import { Plus, ShoppingBag, Sparkles, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { getBestSellers } from '@/lib/actions/rasa-ibu/public-products';
import { toast } from 'sonner';

interface CheckoutSuggestionsProps {
    brandId: string;
    compact?: boolean;
}

export default function CheckoutSuggestions({ brandId, compact = false }: CheckoutSuggestionsProps) {
    const { addToCart } = useCart();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSuggestions() {
            try {
                const data = await getBestSellers(brandId, 4);
                setSuggestions(data);
            } catch (error) {
                console.error('Failed to load suggestions:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSuggestions();
    }, [brandId]);

    const handleAddToCart = (product: any) => {
        if (!product.variantId) {
            toast.error('Produk ini tidak memiliki varian aktif.');
            return;
        }

        if (!product.inStock) {
            toast.error('Maaf Bunda, menu ini sudah habis.');
            return;
        }

        addToCart({
            productId: product.id,
            variantId: product.variantId,
            name: product.name,
            price: product.price,
            image: product.image || '',
            quantity: 1,
            variantName: 'Porsi Keluarga',
            type: 'UNIT'
        });

        toast.success(`${product.name} ditambahkan ke keranjang!`, {
            icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
            className: "bg-emerald-50 border-emerald-200 text-emerald-900 font-black",
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (suggestions.length === 0) {
        console.log(`[CheckoutSuggestions] No suggestions found for brand: ${brandId}`);
        return null;
    }

    return (
        <div className={`space-y-6 ${compact ? 'bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100/50' : ''}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-2'}`}>
                <div className={`p-2 bg-amber-100 text-amber-600 rounded-xl ${compact ? 'scale-75 origin-left' : ''}`}>
                    <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-black text-[#2D3A2D] leading-none`}>Saran Bunda</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lengkapi Menu Hari Ini</p>
                </div>
            </div>

            <div className={compact ? "flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2" : "grid gap-4"}>
                {suggestions.map((item) => (
                    <div
                        key={item.id}
                        className={`group bg-white rounded-3xl border border-[#E5E1D8] p-4 flex gap-4 hover:border-amber-200 hover:shadow-xl hover:shadow-[#2D3A2D]/5 transition-all duration-500 ${compact ? 'min-w-[280px] shrink-0' : ''}`}
                    >
                        <div className={`${compact ? 'w-20 h-20' : 'w-24 h-24'} rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100`}>
                            <img
                                src={item.image || '/placeholder-product.jpg'}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>

                        <div className="flex flex-col justify-between flex-grow py-1">
                            <div>
                                <h4 className="font-black text-[#1A241A] text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">
                                    {item.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    {item.category}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-black text-amber-600">
                                    Rp {item.price.toLocaleString()}
                                </span>
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    disabled={!item.inStock}
                                    className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-lg ${item.inStock
                                        ? 'bg-[#2D3A2D] text-white hover:bg-amber-600 shadow-emerald-900/10'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                                        }`}
                                >
                                    {item.inStock ? <Plus className="w-4 h-4" /> : <span className="text-[8px] font-black uppercase px-0.5">Habis</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!compact && (
                <button className="w-full py-4 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-white hover:text-[#2D3A2D] transition-all flex items-center justify-center gap-2 group">
                    Lihat Menu Lainnya
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>
    );
}
