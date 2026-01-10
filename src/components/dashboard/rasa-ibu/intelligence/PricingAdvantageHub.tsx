'use client';

import React, { useState, useEffect } from 'react';
import {
    X, TrendingUp, DollarSign, Zap, AlertCircle,
    ArrowUpRight, ArrowDownRight, Info, PieChart,
    CheckCircle2, Target, BarChart3, Save, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
    calculateDynamicPricing,
    applyPriceAdjustment,
    getRecipeCostingAction
} from '@/lib/actions/rasa-ibu/intelligence';
import { getBrandConfigAction, updateBrandConfigAction } from '@/lib/actions/content/updateBrandConfig';

interface PricingAdvantageHubProps {
    brandId: string;
    onClose: () => void;
}

export default function PricingAdvantageHub({ brandId, onClose }: PricingAdvantageHubProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [recipeCosting, setRecipeCosting] = useState<any[]>([]);
    const [config, setConfig] = useState({
        defaultOverheadPerUnit: 0,
        targetMonthlyVolume: 1,
        marketplaceFeeRate: 0.15,
        targetNetMarginRate: 0.30,
        operationalOverhead: 0,
        overheadBreakdown: {
            electricity: 0,
            water: 0,
            gas: 0,
            labor: 0
        }
    });
    const [applying, setApplying] = useState<string | null>(null);
    const [savingConfig, setSavingConfig] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [pricingRes, configRes, costingRes] = await Promise.all([
            calculateDynamicPricing(brandId),
            getBrandConfigAction(brandId),
            getRecipeCostingAction(brandId)
        ]);

        if (pricingRes.success) {
            setData(pricingRes.data);
        }
        if (configRes.success && configRes.data) {
            setConfig({
                defaultOverheadPerUnit: (configRes.data as any).defaultOverheadPerUnit || 0,
                targetMonthlyVolume: (configRes.data as any).targetMonthlyVolume || 1,
                marketplaceFeeRate: (configRes.data as any).marketplaceFeeRate || 0.15,
                targetNetMarginRate: (configRes.data as any).targetNetMarginRate || 0.30,
                operationalOverhead: (configRes.data as any).operationalOverhead || 0,
                overheadBreakdown: (configRes.data as any).overheadBreakdown || {
                    electricity: 0,
                    water: 0,
                    gas: 0,
                    labor: 0
                }
            });
        }
        if (costingRes?.success) {
            setRecipeCosting(costingRes.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const handleApply = async (adj: any) => {
        setApplying(adj.variantId);
        const res = await applyPriceAdjustment(adj.variantId, adj.recommendedPrice);
        if (res.success) {
            await loadData();
        } else {
            toast.error('Gagal memperbarui harga.');
        }
        setApplying(null);
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        const res = await updateBrandConfigAction(brandId, config);
        if (res.success) {
            // Reload pricing data as it depends on these config values
            await loadData();
        } else {
            toast.error('Gagal menyimpan konfigurasi.');
        }
        setSavingConfig(false);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Dynamic Pricing Intelligence</span>
                            <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Phase 11 Active</div>
                        </div>
                        <h2 className="text-4xl font-black text-[#1A241A] tracking-tighter">Pricing <span className="text-emerald-600">Advantage Hub</span></h2>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white border border-[#E5E1D8] rounded-2xl hover:bg-stone-50 transition-all shadow-sm"
                >
                    <X className="w-6 h-6 text-stone-400" />
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menganalisis Efisiensi Harga & OPEX...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    {/* Insights & Recommendations */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex items-center gap-4 relative overflow-hidden group">
                                {data?.overhead?.opexTotal && data?.overhead?.opexTotal > 0 && (
                                    <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest animate-pulse">
                                        Live Opex
                                    </div>
                                )}
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#8B7E66] uppercase">Overhead / Unit</p>
                                    <p className="text-2xl font-black text-[#2D3A2D]">Rp {(data?.overhead?.perUnitDynamic || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#8B7E66] uppercase">Velocity Index</p>
                                    <p className="text-2xl font-black text-[#2D3A2D]">{(data?.velocityIndex * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${recipeCosting.some(r => r.isSuboptimal) ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#8B7E66] uppercase">Recipe Health</p>
                                    <p className="text-2xl font-black text-[#2D3A2D]">{recipeCosting.filter(r => !r.isSuboptimal).length}/{recipeCosting.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* NEW: Smart Recipe Costing Breakdown */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] px-2 flex items-center gap-2">
                                <Zap size={12} className="text-amber-500" />
                                Analisis Modal Resep (True HPP)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {recipeCosting.slice(0, 4).map((recipe, idx) => (
                                    <div key={idx} className={`p-6 bg-white border rounded-[2rem] transition-all relative overflow-hidden ${recipe.isSuboptimal ? 'border-rose-200 bg-rose-50/20' : 'border-[#E5E1D8]'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h5 className="font-black text-[#1A241A] text-sm group-hover:text-emerald-600 transition-colors uppercase">{recipe.name}</h5>
                                                <p className="text-[9px] font-bold text-[#8B7E66] uppercase">HPP: Rp {Math.round(recipe.trueHpp).toLocaleString()}</p>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${recipe.isSuboptimal ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {Math.round(recipe.currentMargin)}% Margin
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${recipe.isSuboptimal ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(100, (recipe.currentMargin / recipe.targetMargin) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[8px] font-black uppercase">
                                                <span className="text-slate-400">Target: {recipe.targetMargin}%</span>
                                                <span className={recipe.isSuboptimal ? 'text-rose-600' : 'text-emerald-600'}>
                                                    {recipe.isSuboptimal ? `Kurang ${(recipe.targetMargin - recipe.currentMargin).toFixed(1)}%` : 'Target Tercapai'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Adjustments List */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] px-2 flex items-center gap-2">
                                <DollarSign size={12} className="text-emerald-600" />
                                Rekomendasi Penyesuaian Harga (Markup & Surge)
                            </h4>
                            {data?.adjustments?.length === 0 ? (
                                <div className="p-12 text-center bg-stone-50/50 border-2 border-dashed border-[#E5E1D8] rounded-[2rem]">
                                    <p className="text-stone-400 text-sm font-medium italic">Semua harga sudah optimal sesuai margin target & overhead.</p>
                                </div>
                            ) : (
                                data?.adjustments?.map((adj: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-[#E5E1D8] rounded-[2rem] p-8 hover:shadow-xl hover:border-emerald-200 transition-all group">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex-1 space-y-4 w-full">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${adj.type === 'SURGE' ? 'bg-rose-50 text-rose-600' :
                                                        adj.type === 'DISCOUNT' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {adj.type === 'SURGE' ? <ArrowUpRight size={18} /> :
                                                            adj.type === 'DISCOUNT' ? <ArrowDownRight size={18} /> :
                                                                <Target size={18} />}
                                                    </div>
                                                    <h5 className="font-black text-[#1A241A] text-lg uppercase tracking-tight">{adj.variantName}</h5>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                                        <p className="text-[8px] font-black text-[#8B7E66] uppercase mb-1">Harga Sekarang</p>
                                                        <p className="text-sm font-black text-stone-400 line-through">Rp {adj.currentPrice.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                                        <p className="text-[8px] font-black text-[#8B7E66] uppercase mb-1">Rekomendasi AI</p>
                                                        <p className="text-sm font-black text-emerald-700">Rp {adj.recommendedPrice.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-medium text-[#8B7E66] bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                    <Info size={14} className="text-emerald-400" />
                                                    {adj.reason}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleApply(adj)}
                                                disabled={applying === adj.variantId}
                                                className="w-full md:w-auto px-8 py-5 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {applying === adj.variantId ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : <CheckCircle2 size={14} className="text-emerald-400" />}
                                                Terapkan Harga Baru
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar: OPEX Breakdown */}
                    <div className="space-y-8">
                        <div className="bg-[#1A241A] rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#B2BCA2] mb-6 flex items-center gap-2">
                                <PieChart size={14} />
                                Allocated OPEX Impact
                            </h4>

                            <div className="space-y-6">
                                {data?.overheadBreakdown?.length === 0 ? (
                                    <p className="text-xs text-stone-500 font-medium italic">Belum ada data pengeluaran operasional di Ledger.</p>
                                ) : (
                                    data?.overheadBreakdown?.map((item: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black uppercase text-white">{item.name}</p>
                                                <p className="text-[10px] font-bold text-[#B2BCA2]">Rp {(item.amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(item.amount / data.overhead.opexTotal) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-10 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-stone-400 uppercase">
                                            {(data?.overhead?.opexTotal || 0) > 0 ? 'Live Monthly OPEX' : 'Fallback Overhead Mode'}
                                        </p>
                                        <p className="text-lg font-black text-emerald-400">
                                            {data?.overhead?.opexTotal > 0
                                                ? `Rp ${(data?.overhead?.opexTotal || 0).toLocaleString()}`
                                                : `Rp ${(typeof data?.overhead?.perUnitDynamic === 'number' ? data.overhead.perUnitDynamic : 0).toLocaleString()} / unit`
                                            }
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg ${(data?.overhead?.opexTotal || 0) > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        <Zap size={16} className={(data?.overhead?.opexTotal || 0) > 0 ? 'animate-pulse' : ''} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Strategy Config */}
                        <div className="bg-[#F9F7F2] rounded-[2.5rem] border border-[#E5E1D8] p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#8B7E66] flex items-center gap-2">
                                    <Target size={14} />
                                    Strategy Parameters
                                </h4>
                                {savingConfig ? (
                                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                                ) : (
                                    <button
                                        onClick={handleSaveConfig}
                                        className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                                    >
                                        <Save size={12} />
                                        Save
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-[#8B7E66] uppercase tracking-wider px-1">Default Overhead (Fallback)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">Rp</span>
                                        <input
                                            type="number"
                                            value={config.defaultOverheadPerUnit}
                                            onChange={e => setConfig({ ...config, defaultOverheadPerUnit: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl py-3 pl-10 pr-4 text-sm font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-[#8B7E66] uppercase tracking-wider px-1">Target Monthly Volume</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={config.targetMonthlyVolume}
                                            onChange={e => setConfig({ ...config, targetMonthlyVolume: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl py-3 px-4 text-sm font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 uppercase">Unit</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-[#8B7E66] uppercase tracking-wider px-1">Operational Overhead (Per Order)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">Rp</span>
                                        <input
                                            type="number"
                                            value={config.operationalOverhead}
                                            onChange={e => setConfig({ ...config, operationalOverhead: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl py-3 pl-10 pr-4 text-sm font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                    </div>
                                    <p className="text-[8px] text-[#8B7E66] font-medium leading-tight px-1 italic mt-1 opacity-70">
                                        Packing, stiker, plastik, dll per pesanan.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[#8B7E66] uppercase tracking-wider px-1">Marketplace Fee</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={config.marketplaceFeeRate * 100}
                                                onChange={e => setConfig({ ...config, marketplaceFeeRate: (parseFloat(e.target.value) || 0) / 100 })}
                                                className="w-full bg-white border border-[#E5E1D8] rounded-xl py-3 px-4 text-sm font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 uppercase">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-[#8B7E66] uppercase tracking-wider px-1">Target Net Margin</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={config.targetNetMarginRate * 100}
                                                onChange={e => setConfig({ ...config, targetNetMarginRate: (parseFloat(e.target.value) || 0) / 100 })}
                                                className="w-full bg-white border border-[#E5E1D8] rounded-xl py-3 px-4 text-sm font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 uppercase">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3">
                                    <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-emerald-700/80 leading-relaxed italic">
                                        "Jika <strong>Live OPEX</strong> tersedia, sistem akan mengabaikan fallback dan menggunakan data real untuk proteksi margin maksimal."
                                    </p>
                                </div>

                                {/* Overhead Breakdown Sub-sections */}
                                <div className="pt-4 border-t border-stone-200">
                                    <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-wider px-1 block mb-3">Live OPEX Breakdown (Monthly)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'electricity', label: 'Listrik', icon: Zap },
                                            { id: 'water', label: 'Air (PDAM)', icon: Info },
                                            { id: 'gas', label: 'Gas (LPG)', icon: TrendingUp },
                                            { id: 'labor', label: 'Gaji Staff', icon: DollarSign }
                                        ].map((item) => (
                                            <div key={item.id} className="space-y-1.5">
                                                <label className="text-[8px] font-bold text-[#8B7E66] uppercase">{item.label}</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-400">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={config.overheadBreakdown[item.id as keyof typeof config.overheadBreakdown] || 0}
                                                        onChange={e => setConfig({
                                                            ...config,
                                                            overheadBreakdown: {
                                                                ...config.overheadBreakdown,
                                                                [item.id]: parseFloat(e.target.value) || 0
                                                            }
                                                        })}
                                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl py-2 pl-8 pr-3 text-xs font-black text-[#2D3A2D] outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
