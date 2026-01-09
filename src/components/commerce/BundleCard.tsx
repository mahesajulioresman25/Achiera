'use client';

import React from 'react';
import { ShoppingBasket, ArrowRight, ShoppingCart, Package, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BundleCardProps {
    bundle: any;
    onAddToCart: (bundle: any) => void;
}

export default function BundleCard({ bundle, onAddToCart }: BundleCardProps) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group flex flex-col h-full overflow-hidden relative">
            {/* Savings Badge */}
            <div className="absolute top-6 right-6 z-10">
                <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none">Hemat</span>
                    <span className="text-lg font-black leading-none">20 rb</span>
                </div>
            </div>

            <div className="mb-6 flex-1">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ShoppingBasket className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-[#2D3A2D] group-hover:text-amber-600 transition-colors leading-tight">
                        {bundle.title}
                    </h3>
                    <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                        <Sparkles className="h-5 w-5" />
                    </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    {bundle.description || 'Pilihan terbaik untuk keluarga.'}
                </p>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isi Paket:</p>
                    {bundle.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm shadow-sm">
                                {item.quantity}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{item.variant?.product?.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-stone-100 mt-auto">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Harga Paket</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-[#2D3A2D]">Rp {Number(bundle.price).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => onAddToCart(bundle)}
                    className="w-full py-7 bg-[#2D3A2D] hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-amber-200"
                >
                    Pesan Paket Ini <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
