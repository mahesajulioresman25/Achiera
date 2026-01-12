'use client';

import React from 'react';
import IntentCheckoutForm from '@/components/commerce/IntentCheckoutForm';
import { useCart } from '@/lib/contexts/CartContext';
import Link from 'next/link';
import PlatformLinks from '@/components/commerce/PlatformLinks';

interface CheckoutFlowProps {
    platformLinks?: any;
    upsellProducts?: any[];
}

export default function CheckoutFlow({ platformLinks, upsellProducts = [] }: CheckoutFlowProps) {
    const { items, cartTotal, addToCart } = useCart();

    const renderUpsell = () => {
        if (!upsellProducts || upsellProducts.length === 0) return null;

        // Filter out products already in cart
        const cartIds = items.map(i => i.productId);
        const availableUpsells = upsellProducts.filter(p => !cartIds.includes(p.id));

        if (availableUpsells.length === 0) return null;

        return (
            <div className="mt-12 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#E5E1D8]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] px-4">Bunda Mungkin Lupa Ini?</span>
                    <div className="flex-1 h-px bg-[#E5E1D8]"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableUpsells.map((product) => (
                        <div key={product.id} className="bg-white border border-[#E5E1D8] p-4 rounded-2xl flex gap-4 hover:shadow-md transition-shadow group">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                                <img src={product.image || '/placeholder-recipe.jpg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div>
                                    <h4 className="text-[11px] font-black text-[#2D3A2D] line-clamp-1">{product.name}</h4>
                                    <p className="text-[10px] font-bold text-[#8B7E66]">Rp {product.price.toLocaleString('id-ID')}</p>
                                </div>
                                <button
                                    onClick={() => addToCart({
                                        productId: product.id,
                                        variantId: product.variantId,
                                        name: product.name,
                                        price: product.price,
                                        image: product.image,
                                        quantity: 1,
                                        variantName: 'Porsi Keluarga'
                                    })}
                                    className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2] hover:text-[#2D3A2D] transition-colors flex items-center gap-1"
                                >
                                    ＋ Tambah Menu
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-32 pb-40 bg-[#FDFBF7]">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

                    {/* Left Side: Order Summary */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">Ringkasan Dapur</span>
                            <h1 className="text-4xl md:text-5xl font-black text-[#2D3A2D] tracking-tight leading-tight">Hangatnya Hidangan <br />Untuk Keluarga Anda.</h1>
                        </div>

                        <div className="space-y-6">
                            {items.length === 0 ? (
                                // ... empty cart view ...
                                <div className="p-12 border-2 border-[#E5E1D8] border-dashed rounded-3xl text-center space-y-6 bg-gradient-to-br from-white to-[#FDFBF7] shadow-sm">
                                    <div className="w-16 h-16 bg-[#E5E1D8] rounded-2xl flex items-center justify-center mx-auto text-3xl">🍽️</div>
                                    <p className="text-sm text-gray-600 font-medium">Belum ada menu yang dipilih, Bunda.</p>
                                    <Link
                                        href="/rasa-ibu/products"
                                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-colors group"
                                    >
                                        Kembali ke Menu
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-[#E5E1D8] border-t border-b border-[#E5E1D8]">
                                        {items.map((item) => (
                                            <div key={item.id} className="py-6 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1 flex-1">
                                                        <p className="text-sm font-black text-[#2D3A2D]">{item.name}</p>
                                                        <p className="text-[10px] text-[#8B7E66] font-medium uppercase tracking-widest">
                                                            {item.quantity} Porsi • {item.variantName}
                                                        </p>
                                                        {item.note && (
                                                            <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-1">📝 Catatan Khusus:</p>
                                                                <p className="text-xs text-amber-900 italic leading-relaxed">"{item.note}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-black text-[#2D3A2D] ml-4">
                                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add More Items Button */}
                                    <Link
                                        href="/rasa-ibu/products"
                                        className="block w-full py-5 bg-white border-2 border-dashed border-[#E5E1D8] rounded-2xl text-center text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:bg-gradient-to-br hover:from-[#FDFBF7] hover:to-white hover:border-[#8B7E66] transition-all duration-300 group shadow-sm hover:shadow-md"
                                    >
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                                            Tambah Menu Lain
                                        </span>
                                    </Link>

                                    <div className="flex justify-between items-baseline pt-6">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Perkiraan</p>
                                        <p className="text-4xl font-black text-[#2D3A2D]">Rp {cartTotal.toLocaleString('id-ID')}</p>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-100 rounded-2xl flex gap-4 shadow-sm">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm">
                                            🚚
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Jaminan Kesegaran</p>
                                            <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">
                                                Menu dikirim dalam keadaan beku (frozen) untuk menjaga kejujuran rasa hingga meja makan Bunda.
                                            </p>
                                        </div>
                                    </div>

                                    {/* UPSell Section */}
                                    {renderUpsell()}
                                </>
                            )}
                        </div>

                        {/* Platform Links */}
                        {platformLinks && (
                            <div className="pt-10 border-t border-[#E5E1D8]">
                                <PlatformLinks links={platformLinks} />
                            </div>
                        )}
                    </div>

                    {/* Right Side: Intent Checkout Form */}
                    <div className="sticky top-32">
                        <IntentCheckoutForm />
                    </div>

                </div>
            </div>
        </div>
    );
}
