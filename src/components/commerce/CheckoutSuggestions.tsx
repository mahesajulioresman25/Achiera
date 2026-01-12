'use client';

import React, { useEffect, useState } from 'react';
import { Plus, ShoppingBag, Sparkles, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { getBestSellers } from '@/lib/actions/rasa-ibu/public-products';
import { toast } from 'sonner';

interface CheckoutSuggestionsProps {
    brandId: string;
}

export default function CheckoutSuggestions({ brandId }: CheckoutSuggestionsProps) {
    const { addItem } = useCart();
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

        addItem({
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

    if (suggestions.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-[#2D3A2D] leading-none">Saran Bunda</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lengkapi Menu Hari Ini</p>
                </div>
            </div>

            <div className="grid gap-4">
                {suggestions.map((item) => (
                    <div
                        key={item.id}
                        className="group bg-white rounded-3xl border border-[#E5E1D8] p-4 flex gap-4 hover:border-amber-200 hover:shadow-xl hover:shadow-[#2D3A2D]/5 transition-all duration-500"
                    >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
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
                                    className="p-2 bg-[#2D3A2D] text-white rounded-xl hover:bg-amber-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-900/10"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full py-4 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-white hover:text-[#2D3A2D] transition-all flex items-center justify-center gap-2 group">
                Lihat Menu Lainnya
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
