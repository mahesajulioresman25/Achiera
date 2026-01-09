'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, AlertTriangle, TrendingUp, Copy, Check, MessageSquare, Package } from 'lucide-react';
import { getProcurementAdviceAction } from '@/lib/actions/rasa-ibu/procurement';

interface ProcurementAdvisorProps {
    brandId: string;
    onClose: () => void;
}

export default function ProcurementAdvisor({ brandId, onClose }: ProcurementAdvisorProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadAdvice = async () => {
            setIsLoading(true);
            const res = await getProcurementAdviceAction(brandId);
            if (res.success) setSuggestions(res.data);
            setIsLoading(false);
        };
        loadAdvice();
    }, [brandId]);

    const handleCopyWA = () => {
        const criticalItems = suggestions.filter(s => s.suggestedPurchase > 0);
        if (criticalItems.length === 0) return;

        let text = `*Daftar Belanja Rasa Ibu*\n`;
        text += `_Prediksi kebutuhan untuk 7 hari ke depan_\n\n`;

        criticalItems.forEach(item => {
            text += `• *${item.ingredientName}*: ${item.suggestedPurchase} ${item.unit}\n`;
        });

        text += `\n_Mohon dibantu order ya, terima kasih!_ 🙏✨`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-3xl max-h-[85vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-[#E5E1D8] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-50 rounded-2xl">
                            <ShoppingCart className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">Proactive Procurement</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Penasihat Belanja Pintar</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menganalisa Riwayat Jualan Bunda...</p>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <Package className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Belum ada data cukup untuk memprediksi.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                                <TrendingUp className="w-5 h-5 text-emerald-600 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-emerald-900">Hasil Analisis 30 Hari Terakhir</p>
                                    <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                                        Berdasarkan jualan Bunda sebulan terakhir, sistem menghitung kebutuhan bahan untuk 7 hari ke depan.
                                        Baris dengan label <span className="font-black">CRITICAL</span> berarti stok Bunda akan habis dalam kurang dari 2 hari.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {suggestions.map((item) => (
                                    <div
                                        key={item.ingredientId}
                                        className={`p-5 rounded-2xl border transition-all hover:shadow-md flex items-center justify-between ${item.isCritical ? 'bg-rose-50 border-rose-100' : 'bg-white border-[#E5E1D8]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isCritical ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                <ShoppingCart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-[#2D3A2D] uppercase tracking-tight">{item.ingredientName}</h4>
                                                    {item.isCritical && (
                                                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest">Critical</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400">Rata-rata: {item.avgDailyUsage} {item.unit} / hari</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Saran Beli:</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className={`text-xl font-black ${item.suggestedPurchase > 0 ? (item.isCritical ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-300'}`}>
                                                    {item.suggestedPurchase > 0 ? `+${item.suggestedPurchase}` : 'Aman'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400">Tersisa: {item.daysRemaining} hari</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-[#FDFBF7] border-t border-[#E5E1D8] flex justify-between items-center gap-4">
                    <p className="flex-1 text-[10px] text-[#8B7E66] italic leading-relaxed font-medium">
                        *Saran ini hanyalah perkiraan berdasarkan data jualan. Pastikan cek fisik gudang sebelum belanja ya Bun!
                    </p>
                    <button
                        onClick={handleCopyWA}
                        disabled={suggestions.filter(s => s.suggestedPurchase > 0).length === 0}
                        className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 ${copied ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                            }`}
                    >
                        {copied ? (
                            <><Check className="w-4 h-4" /> Berhasil Di-copy</>
                        ) : (
                            <><MessageSquare className="w-4 h-4" /> Copy untuk WhatsApp</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
