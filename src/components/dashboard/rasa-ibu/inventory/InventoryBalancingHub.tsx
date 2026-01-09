'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Sparkles, ArrowRightLeft, Zap, AlertTriangle,
    Warehouse, Package, History, CheckCircle2, ChevronRight,
    ArrowDown, ArrowUp, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { getInventoryInsightsAction, executeStockTransferAction } from '@/lib/actions/rasa-ibu/inventory';
import { useSession } from 'next-auth/react';

interface InventoryBalancingHubProps {
    brandId: string;
    onClose: () => void;
}

export default function InventoryBalancingHub({ brandId, onClose }: InventoryBalancingHubProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<any>(null);
    const [executing, setExecuting] = useState<string | null>(null);

    const loadInsights = async () => {
        setLoading(true);
        const res = await getInventoryInsightsAction(brandId);
        if (res.success) {
            setInsights(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadInsights();
    }, [brandId]);

    const handleTransfer = async (rec: any) => {
        if (!session?.user?.id) return;

        setExecuting(rec.variantId);
        const res = await executeStockTransferAction(
            brandId,
            rec.fromWarehouseId,
            rec.toWarehouseId,
            rec.variantId,
            rec.suggestedQuantity,
            session.user.id
        );

        if (res.success) {
            // Refresh insights
            await loadInsights();
            toast.success(`Berhasil memindahkan ${rec.suggestedQuantity} unit ${rec.variantName}`);
        } else {
            toast.error('Gagal mengeksekusi transfer: ' + res.error);
        }
        setExecuting(null);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">AI Inventory Optimization</span>
                            <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Phase 9 Active</div>
                        </div>
                        <h2 className="text-4xl font-black text-[#1A241A] tracking-tighter">Inventory <span className="text-indigo-600">Balancing Hub</span></h2>
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
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menganalisis Kesenjangan Stok...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    {/* Insights & Recommendations */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Summary */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap size={120} className="text-indigo-600" />
                            </div>
                            <div className="relative z-10 flex items-center gap-8">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${insights?.imbalance?.status === 'ACTION_REQUIRED'
                                    ? 'border-amber-100 bg-amber-50 text-amber-600'
                                    : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {insights?.imbalance?.status === 'ACTION_REQUIRED' ? <Zap size={32} /> : <CheckCircle2 size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A241A] mb-1">
                                        {insights?.imbalance?.status === 'ACTION_REQUIRED'
                                            ? 'Terdapat Ketimpangan Stok'
                                            : 'Ecosystem Seimbang'}
                                    </h3>
                                    <p className="text-sm font-medium text-[#8B7E66]">
                                        {insights?.imbalance?.status === 'ACTION_REQUIRED'
                                            ? `AI mendeteksi ${insights.imbalance.recommendations.length} potensi rebalancing untuk optimasi distribusi.`
                                            : 'Distribusi stok antar gudang berada dalam parameter efisiensi optimal.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations List */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] px-2 flex items-center gap-2">
                                <ArrowRightLeft size={12} className="text-indigo-600" />
                                Rekomendasi Pemindahan (Rebalancing)
                            </h4>
                            {insights?.imbalance?.recommendations?.length === 0 ? (
                                <div className="p-12 text-center bg-stone-50/50 border-2 border-dashed border-[#E5E1D8] rounded-[2rem]">
                                    <p className="text-stone-400 text-sm font-medium italic">Tidak ada pemindahan yang disarankan saat ini.</p>
                                </div>
                            ) : (
                                insights?.imbalance?.recommendations?.map((rec: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-[#E5E1D8] rounded-[2rem] p-8 hover:shadow-xl hover:border-indigo-200 transition-all group">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex-1 space-y-6 w-full">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 rounded-2xl">
                                                        <Package className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-[#1A241A] text-lg uppercase tracking-tight">{rec.variantName}</h5>
                                                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">{rec.sku}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]">
                                                    <div className="text-center flex-1">
                                                        <p className="text-[8px] font-black uppercase text-[#8B7E66] mb-1">Dari</p>
                                                        <p className="text-xs font-black text-[#2D3A2D]">{rec.fromWarehouseName}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                                            <ArrowRightLeft size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-600">{rec.suggestedQuantity}</span>
                                                    </div>
                                                    <div className="text-center flex-1">
                                                        <p className="text-[8px] font-black uppercase text-[#8B7E66] mb-1">Ke</p>
                                                        <p className="text-xs font-black text-[#2D3A2D]">{rec.toWarehouseName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-medium text-[#8B7E66] bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                    <Info size={14} className="text-indigo-400" />
                                                    {rec.reason}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleTransfer(rec)}
                                                disabled={executing === rec.variantId}
                                                className="w-full md:w-auto px-8 py-5 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {executing === rec.variantId ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : <Zap size={14} className="text-amber-400" />}
                                                Eksekusi Pindah
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Waste Risk & Analytics */}
                    <div className="space-y-8">
                        {/* Waste Risk Sidebar */}
                        <div className="bg-stone-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-6 flex items-center gap-2">
                                <AlertTriangle size={14} />
                                Waste Risk Management
                            </h4>

                            <div className="space-y-6">
                                {insights?.wasteRisk?.length === 0 ? (
                                    <p className="text-xs text-stone-400 font-medium italic">Tidak ada stok berisiko tinggi terdeteksi.</p>
                                ) : (
                                    insights?.wasteRisk?.map((risk: any, idx: number) => (
                                        <div key={idx} className="border-l-2 border-rose-500 pl-4 py-2 space-y-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight text-white mb-0.5">{risk.variantName}</p>
                                                <div className="flex items-center gap-2 text-[8px] font-bold text-stone-400">
                                                    <span>{risk.quantity} Units</span>
                                                    <span>•</span>
                                                    <span className="text-rose-400">Exp: {new Date(risk.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                <p className="text-[9px] font-bold text-stone-300 leading-relaxed mb-3">
                                                    Pindahkan ke **{risk.suggestedWarehouse}** untuk mempercepat perputaran.
                                                </p>
                                                <button
                                                    onClick={() => handleTransfer({
                                                        variantId: risk.variantId,
                                                        variantName: risk.variantName,
                                                        fromWarehouseId: risk.currentWarehouseId,
                                                        toWarehouseId: risk.suggestedWarehouseId,
                                                        suggestedQuantity: risk.quantity
                                                    })}
                                                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Pindah Sekarang
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <button className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-colors">
                                    <span>Riwayat Transfer Ekosistem</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Inventory Velocity Card (Placeholder Context) */}
                        <div className="bg-[#F9F7F2] rounded-[2.5rem] border border-[#E5E1D8] p-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#8B7E66] mb-4">Stock Velocity Hint</h4>
                            <p className="text-xs text-[#8B7E66] font-medium leading-relaxed">
                                AI menyarankan untuk menjaga stok di **Gudang Pusat** minimal 30% lebih tinggi dari satelit untuk mendukung ritme produksi harian.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
