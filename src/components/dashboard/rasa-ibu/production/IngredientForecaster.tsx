'use client';

import React, { useState } from 'react';
import { BarChart3, Search, AlertTriangle, ArrowRight, Package, Calculator } from 'lucide-react';
import { getIngredientForecastAction } from '@/lib/actions/rasa-ibu/production';

interface IngredientForecasterProps {
    brandId: string;
    plans: any[];
}

export default function IngredientForecaster({ brandId, plans }: IngredientForecasterProps) {
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculate = async () => {
        if (!selectedPlanId) return;
        setIsLoading(true);
        const res = await getIngredientForecastAction(brandId, selectedPlanId);
        setIsLoading(false);
        if (res.success && res.data) setForecastData(res.data);
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-[#2D3A2D]">Ramalan Kebutuhan Bahan</h3>
                    <p className="text-xs text-slate-400 font-medium">Hitung total bahan baku yang diperlukan untuk rencana belanja.</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Select Plan */}
                <div className="col-span-1 space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Pilih Rencana Produksi</label>
                        <select
                            value={selectedPlanId}
                            onChange={e => setSelectedPlanId(e.target.value)}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-bold text-[#2D3A2D] outline-none"
                        >
                            <option value="">-- Pilih Rencana --</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {new Date(plan.date).toLocaleDateString('id-ID')} ({plan.items.length} Menu)
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleCalculate}
                            disabled={!selectedPlanId || isLoading}
                            className="w-full bg-[#2D3A2D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-[#1A241A] transition-all disabled:opacity-50"
                        >
                            <Calculator className="w-4 h-4" /> Hitung Kebutuhan
                        </button>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                        <div className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Tips Belanja</span>
                        </div>
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                            Sistem menghitung berdasarkan takaran resep. Pastikan Bunda belanja sedikit lebih banyak untuk cadangan (waste).
                        </p>
                    </div>
                </div>

                {/* Results */}
                <div className="col-span-2 space-y-6">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Menghitung Gramasi...</p>
                        </div>
                    ) : forecastData.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Ringkasan Bahan yang Dibutuhkan</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {forecastData.map((item) => {
                                    const isShort = item.stockOnHand < item.totalQuantity;
                                    return (
                                        <div key={item.id} className="p-5 bg-white border border-[#E5E1D8] rounded-2xl flex items-center justify-between group hover:border-emerald-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isShort ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#2D3A2D] uppercase tracking-tight">{item.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400">SKU: {item.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end mb-1">
                                                    <span className="text-xs font-black text-[#2D3A2D]">{item.totalQuantity}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-black uppercase text-slate-400">Stok Saat Ini:</span>
                                                    <span className={`text-[9px] font-black ${isShort ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                        {item.stockOnHand}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-slate-50/30 rounded-[3rem] border border-dashed border-slate-200">
                            <BarChart3 className="w-12 h-12 text-slate-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Pilih rencana di samping untuk melihat perkiraan bahan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
