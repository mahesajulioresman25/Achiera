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
        <div className="min-h-screen pt-28 pb-20 bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-4 md:px-6">

                {/* Header Compact */}
                <div className="mb-10 text-center space-y-3">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66] bg-[#8B7E66]/5 px-3 py-1.5 rounded-full">Secure Checkout</span>
                    <h1 className="text-3xl md:text-4xl font-black text-[#2D3A2D] tracking-tight">Hangatnya Hidangan Keluarga.</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* Left: Summary & Suggestions */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6 order-2 lg:order-1">

                        {/* Order Items */}
                        <div className="bg-white rounded-3xl border border-[#E5E1D8] overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-[#E5E1D8]">
                                <h2 className="text-sm font-black text-[#2D3A2D] uppercase tracking-wider flex items-center gap-2">
                                    <span>🥘</span> Ringkasan Pesanan
                                </h2>
                            </div>

                            {items.length === 0 ? (
                                <div className="p-10 text-center space-y-4">
                                    <div className="text-4xl">🍽️</div>
                                    <p className="text-sm text-gray-500">Keranjang Bunda masih kosong.</p>
                                    <Link href="/rasa-ibu/products" className="text-xs font-bold text-[#8B7E66] hover:underline uppercase tracking-wider">
                                        Lihat Menu
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#E5E1D8]">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-6 flex gap-5 items-center hover:bg-[#FDFBF7] transition-colors">
                                            <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                                <img src={item.image || '/placeholder-product.jpg'} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-bold text-[#1A241A] truncate pr-4">{item.name}</p>
                                                    <p className="text-sm font-bold text-[#1A241A]">
                                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[#8B7E66]">
                                                    <span className="font-medium bg-[#F5F3EF] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                                        {item.quantity} x {item.variantName || 'Pack'}
                                                    </span>
                                                    {item.note && <span className="italic opacity-80 truncate max-w-[200px]">"{item.note}"</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Subtotal Footer */}
                                    <div className="bg-[#FAF9F6] p-6 flex justify-between items-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Estimasi</p>
                                        <p className="text-2xl font-black text-[#2D3A2D]">Rp {cartTotal.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions (Compact) */}
                        <div className="py-2">
                            <CheckoutSuggestions brandId={brandId} compact={true} />
                        </div>

                        {/* Compact Platform Links */}
                        {platformLinks && (
                            <div className="pt-6 border-t border-[#E5E1D8] opacity-60 hover:opacity-100 transition-opacity">
                                <p className="text-[10px] font-bold text-center text-[#8B7E66] uppercase tracking-widest mb-4">Atau pesan lewat platform lain</p>
                                <PlatformLinks links={platformLinks} compact={true} />
                            </div>
                        )}
                    </div>

                    {/* Right: Checkout Form (Sticky) */}
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 order-1 lg:order-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-[#E5E1D8] p-6 md:p-8 shadow-xl shadow-[#2D3A2D]/5">
                            <IntentCheckoutForm />
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center">
                            <div className="text-xl">🛡️</div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Jaminan Kualitas</p>
                                <p className="text-[10px] text-emerald-700/70 font-medium">Dikirim beku dengan standar keamanan pangan.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
