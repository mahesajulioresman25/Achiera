'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCcw, X, Info, Check } from 'lucide-react';
import { calculateDynamicPricing, applyPriceAdjustment, PriceAdjustment } from '@/lib/intelligence/pricingEngine';
import { toast } from 'sonner';

interface DynamicPricingManagerProps {
    brandId: string;
    onClose: () => void;
}

export default function DynamicPricingManager({ brandId, onClose }: DynamicPricingManagerProps) {
    const [data, setData] = useState<{ adjustments: PriceAdjustment[], velocityIndex: number, lastUpdate: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState<string | null>(null);

    const loadPricing = async () => {
        setIsLoading(true);
        const res = await calculateDynamicPricing(brandId);
        if (res.success && res.data) {
            setData(res.data);
        } else if (!res.success) {
            toast.error("Gagal memuat data harga dinamis");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadPricing();
    }, [brandId]);

    const handleApply = async (adj: PriceAdjustment) => {
        setIsApplying(adj.variantId);
        const res = await applyPriceAdjustment(adj.variantId, adj.recommendedPrice);
        if (res.success) {
            toast.success(`Harga ${adj.variantName} berhasil diupdate!`);
            setData(prev => ({
                ...prev!,
                adjustments: prev!.adjustments.filter(a => a.variantId !== adj.variantId)
            }));
        } else {
            toast.error("Gagal update harga");
        }
        setIsApplying(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-[#E5E1D8] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-50 rounded-2xl">
                            <Zap className="w-8 h-8 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Price Intelligence</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Dynamic Pricing Engine</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={loadPricing} className="p-3 hover:bg-slate-100 rounded-full transition-all">
                            <RefreshCcw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10">

                    {/* Market Pulse Dashboard */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 p-8 bg-white rounded-[2.5rem] border border-[#E5E1D8] flex items-center justify-between shadow-sm">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Demand Velocity</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-5xl font-black text-[#2D3A2D]">{data?.velocityIndex.toFixed(2) || '1.00'}x</span>
                                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${(data?.velocityIndex || 1) > 1.2 ? 'bg-rose-100 text-rose-600' :
                                        (data?.velocityIndex || 1) < 0.8 ? 'bg-blue-100 text-blue-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {(data?.velocityIndex || 1) > 1.2 ? '🔥 SURGE DETECTED' :
                                            (data?.velocityIndex || 1) < 0.8 ? '❄️ SLOW DEMAND' :
                                                '✅ STABLE'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-48 h-16 bg-slate-50 rounded-2xl flex items-center justify-center p-4">
                                <BarChart3 className="w-10 h-10 text-slate-200" />
                            </div>
                        </div>

                        <div className="p-8 bg-[#2D3A2D] text-[#FDFBF7] rounded-[2.5rem] flex flex-col justify-center gap-2">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Total Recommendations</p>
                            <h3 className="text-4xl font-black">{data?.adjustments.length || 0}</h3>
                            <p className="text-[10px] text-emerald-400/50 italic">Smart adjustments ready</p>
                        </div>
                    </div>

                    {/* Recommendations List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">Smart Pricing Recommendations</h4>
                                <p className="text-[10px] text-slate-400 font-medium italic">Sistem menyarankan penyesuaian harga berdasarkan data pesanan terbaru.</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <RefreshCcw className="w-8 h-8 text-amber-500 animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase">Menganalisa kecepatan pasar Bunda...</p>
                            </div>
                        ) : data?.adjustments.length === 0 ? (
                            <div className="py-20 bg-white rounded-[2.5rem] border border-dashed border-[#E5E1D8] flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-emerald-50 rounded-full">
                                    <Check className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Harga Saat Ini Sudah Optimal.<br />Belum Ada Sinyal Perubahan Pasar.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-[#E5E1D8] shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
                                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="px-8 py-5">Produk</th>
                                            <th className="px-8 py-5">Sinyal Nutrisi</th>
                                            <th className="px-8 py-5 text-center">Harga Saat Ini</th>
                                            <th className="px-8 py-5 text-center">Saran Baru</th>
                                            <th className="px-8 py-5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data?.adjustments.map((adj) => (
                                            <tr key={adj.variantId} className="hover:bg-amber-50/10 transition-colors">
                                                <td className="px-8 py-6 font-black text-[#2D3A2D] uppercase text-xs">
                                                    {adj.variantName}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${adj.type === 'SURGE' ? 'bg-rose-50' :
                                                            adj.type === 'SCARCITY' ? 'bg-amber-50' :
                                                                'bg-blue-50'
                                                            }`}>
                                                            {adj.type === 'SURGE' ? <TrendingUp className="w-4 h-4 text-rose-500" /> :
                                                                adj.type === 'SCARCITY' ? <TrendingUp className="w-4 h-4 text-amber-500" /> :
                                                                    <TrendingDown className="w-4 h-4 text-blue-500" />}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className={`text-[9px] font-black uppercase ${adj.type === 'SURGE' ? 'text-rose-600' :
                                                                adj.type === 'SCARCITY' ? 'text-amber-600' :
                                                                    'text-blue-600'
                                                                }`}>{adj.type}</p>
                                                            <p className="text-[8px] text-slate-400 font-medium italic">{adj.reason}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-xs font-bold text-slate-400 line-through">
                                                    Rp {adj.currentPrice.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-sm font-black ${adj.recommendedPrice > adj.currentPrice ? 'text-rose-600' : 'text-blue-600'
                                                            }`}>
                                                            Rp {adj.recommendedPrice.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                                                            {adj.multiplier > 1 ? `+${((adj.multiplier - 1) * 100).toFixed(0)}%` : `${((adj.multiplier - 1) * 100).toFixed(0)}%`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleApply(adj)}
                                                        disabled={isApplying === adj.variantId}
                                                        className="px-6 py-2 bg-[#2D3A2D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1A241A] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isApplying === adj.variantId ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Terapkan'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pro-Tip */}
                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">
                            *Saran: Gunakan **Surge Pricing** (+10%) saat kecepatan pesanan harian naik di atas 1.5x rata-rata mingguan untuk menjaga kapasitas produksi Bunda tetap stabil dan meningkatkan keuntungan.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
