'use client';

import React from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import IntentCheckoutForm from '@/components/commerce/IntentCheckoutForm';
import Link from 'next/link';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import CheckoutSuggestions from '@/components/commerce/CheckoutSuggestions';

interface CheckoutFlowProps {
    platformLinks?: any;
    upsellProducts?: any[];
}

export default function CheckoutFlow({ platformLinks, upsellProducts = [] }: CheckoutFlowProps) {
    const { items, cartTotal, addToCart } = useCart();

    // We'll move upsell logic into CheckoutSuggestions for a cleaner sidebar
    const brandId = 'rasa-ibu'; // Default brand for this flow

    return (
        <div className="min-h-screen pt-32 pb-40 bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* Left: Suggestions Sidebar (Hidden on small mobile if needed, but here we stack) */}
                    <div className="lg:col-span-3 lg:sticky lg:top-32 space-y-10 order-2 lg:order-1">
                        <CheckoutSuggestions brandId={brandId} />
                    </div>

                    {/* Middle: Order Summary */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-12 order-1 lg:order-2">
                        <div className="space-y-6">
                            <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">Ringkasan Dapur</span>
                            <h1 className="text-4xl md:text-5xl font-black text-[#2D3A2D] tracking-tight leading-tight">Hangatnya Hidangan <br />Untuk Keluarga Anda.</h1>
                        </div>

                        <div className="space-y-8">
                            {items.length === 0 ? (
                                <div className="p-12 border-2 border-[#E5E1D8] border-dashed rounded-[3rem] text-center space-y-6 bg-gradient-to-br from-white to-[#FDFBF7] shadow-sm">
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
                                    <div className="bg-white rounded-[3rem] border border-[#E5E1D8] overflow-hidden shadow-xl shadow-[#2D3A2D]/5">
                                        <div className="divide-y divide-[#E5E1D8] px-8 py-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="py-8 flex gap-6 items-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                                                        <img src={item.image || '/placeholder-product.jpg'} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-base font-black text-[#1A241A]">{item.name}</p>
                                                        <p className="text-[10px] text-[#8B7E66] font-bold uppercase tracking-[0.2em] opacity-70">
                                                            {item.quantity} Unit / {item.variantName || 'Varian Standar'}
                                                        </p>
                                                        {item.note && (
                                                            <p className="text-[10px] text-amber-600 font-bold italic mt-1 line-clamp-1">"{item.note}"</p>
                                                        )}
                                                    </div>
                                                    <p className="text-base font-black text-[#1A241A]">
                                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-[#FDFBF7] p-8 border-t border-[#E5E1D8]">
                                            <div className="flex justify-between items-baseline">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Perkiraan</p>
                                                <p className="text-4xl font-black text-[#2D3A2D]">Rp {cartTotal.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/rasa-ibu/products"
                                        className="block w-full py-5 bg-white border-2 border-dashed border-[#E5E1D8] rounded-[2rem] text-center text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:bg-white hover:border-[#2D3A2D] hover:text-[#2D3A2D] transition-all duration-300 group shadow-sm"
                                    >
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                                            Tambah Menu Lain
                                        </span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {platformLinks && (
                            <div className="pt-10 border-t border-[#E5E1D8]">
                                <PlatformLinks links={platformLinks} />
                            </div>
                        )}
                    </div>

                    {/* Right: Checkout Form */}
                    <div className="lg:col-span-12 xl:col-span-4 lg:sticky lg:top-32 order-3">
                        <div className="bg-white rounded-[3rem] border border-[#E5E1D8] p-8 shadow-2xl shadow-[#2D3A2D]/10">
                            <IntentCheckoutForm />

                            <div className="mt-8 p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex gap-4">
                                <div className="text-2xl">🚚</div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Jaminan Kesegaran</p>
                                    <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
                                        Menu beku (frozen) dikirim dengan standar keamanan pangan terbaik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
