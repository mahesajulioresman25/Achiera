'use client';

import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Info, ChevronRight, Loader2, Sparkles, Tag } from 'lucide-react';
import { getBundleAdvisorAction } from '@/lib/actions/rasa-ibu/intelligence';

interface BundleAdvisorProps {
    brandId: string;
}

export default function BundleAdvisor({ brandId }: BundleAdvisorProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        async function load() {
            const res = await getBundleAdvisorAction(brandId);
            if (res.success) {
                setRecommendations(res.data);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-black text-[#8B7E66] uppercase tracking-widest">Menganalisis Pola Pembelian...</p>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto border border-stone-100">
                    <Package className="w-8 h-8 text-stone-300" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#2D3A2D]">Data Belum Mencukupi</h3>
                    <p className="text-[10px] text-[#8B7E66] font-medium max-w-[240px] mx-auto mt-2 leading-relaxed">
                        Sistem membutuhkan lebih banyak transaksi dengan multi-item untuk menganalisis pola bundling yang akurat.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">AI Marketing Advisor</h3>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">NEW</span>
                        </div>
                        <h2 className="text-xl font-black text-[#2D3A2D]">Rekomendasi Paket Bundling</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-700 uppercase tracking-wider self-start md:self-center">
                    <TrendingUp className="w-3 h-3" />
                    Max Profit Strategy
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((bundle, idx) => (
                    <div key={idx} className="group relative bg-[#FDFBF7] border border-[#E5E1D8] rounded-[2rem] p-6 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col justify-between">
                        {/* Match Strength Badge */}
                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">
                                Skor Afinitas: {bundle.matchStrength}x
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Product Thumbnails */}
                            <div className="flex items-center -space-x-4">
                                {bundle.items.map((item: any, idx: number) => (
                                    <div
                                        key={item.id}
                                        className="w-20 h-20 rounded-2xl border-2 border-white overflow-hidden shadow-lg bg-stone-100 group-hover:scale-110 transition-transform duration-500"
                                        style={{ zIndex: 10 - idx }}
                                    >
                                        <img
                                            src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-lg translate-x-4 border-2 border-white z-[15]">
                                    +
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-extrabold text-[#2D3A2D] leading-tight">
                                    {bundle.items.map((it: any) => it.name.split(' - ')[0]).join(' + ')}
                                </h4>
                                <p className="text-[10px] text-[#8B7E66] font-medium mt-1">Item ini paling sering dipesan bersamaan oleh pelanggan.</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#E5E1D8]/50">
                                {/* Pricing Breakdown */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-[#8B7E66] uppercase tracking-tighter">Harga Normal Total</span>
                                        <p className="text-sm font-bold text-stone-400 line-through tracking-tight">Rp {bundle.totalBasePrice.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1">
                                            Harga Paket AI <Tag className="w-2 h-2" />
                                        </span>
                                        <p className="text-sm font-black text-emerald-700 tracking-tight">Rp {bundle.suggestedPrice.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>

                                {/* Profit Intelligence Card */}
                                <div className="bg-white p-4 rounded-2xl border border-emerald-50 flex items-center justify-between shadow-sm">
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[#8B7E66] uppercase">Gabungan HPP</span>
                                        <p className="text-xs font-black text-[#2D3A2D] tracking-tight">Rp {bundle.totalCostPrice.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <span className="text-[8px] font-black text-emerald-600 uppercase">Margin Bundling</span>
                                        <div className="flex items-center justify-end gap-1">
                                            <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                                            <p className="text-xs font-black text-emerald-700 tracking-tight">{bundle.margin.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#FDFBF7] rounded-3xl border border-[#E5E1D8]/50">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-[#E5E1D8]/30">
                    <Info className="w-4 h-4 text-[#8B7E66]" />
                </div>
                <div>
                    <p className="text-[11px] text-[#2D3A2D] font-black uppercase tracking-widest mb-1">Strategi Psikologi Harga</p>
                    <p className="text-[10px] text-[#8B7E66] font-medium leading-relaxed italic">
                        Harga paket di atas telah dioptimalkan secara otomatis untuk memberikan penghematan psikologis kepada pelanggan tanpa mengorbankan pilar profitabilitas minimal 25%. Menggunakan paket ini dapat meningkatkan efisiensi operasional pengiriman.
                    </p>
                </div>
            </div>
        </div>
    );
}
