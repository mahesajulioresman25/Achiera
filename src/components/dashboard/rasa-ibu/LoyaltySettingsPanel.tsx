'use client';

import React from 'react';
import { Star, TrendingUp, Calendar, ChevronRight, Info, Award } from 'lucide-react';

interface LoyaltySettingsPanelProps {
    settings: any;
    onSettingsUpdate: (newSettings: any) => void;
}

export default function LoyaltySettingsPanel({ settings, onSettingsUpdate }: LoyaltySettingsPanelProps) {
    const loyalty = settings.loyalty || {
        pointsPerRupiah: 0.0001,
        tierThresholds: {
            SILVER: 1000000,
            GOLD: 5000000,
            PLATINUM: 10000000
        },
        pointExpiryDays: 365
    };

    const updateLoyalty = (field: string, value: any) => {
        onSettingsUpdate({
            ...settings,
            loyalty: {
                ...loyalty,
                [field]: value
            }
        });
    };

    const updateTier = (tier: string, value: number) => {
        onSettingsUpdate({
            ...settings,
            loyalty: {
                ...loyalty,
                tierThresholds: {
                    ...loyalty.tierThresholds,
                    [tier]: value
                }
            }
        });
    };

    // Helper to convert multiplier/ratio to "Points per Rp 10.000"
    const pointsPer10k = (loyalty.pointsPerRupiah * 10000).toFixed(2);

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 border-b border-[#F9F7F2] pb-4">
                <Star className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Loyalty Member Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Point System Configuration */}
                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-wider">Perolehan Poin</h4>
                            <p className="text-[10px] text-[#8B7E66] font-medium">Atur berapa poin yang didapat pelanggan</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest flex items-center gap-1">
                                Poin per Rp 10.000 <Info className="w-3 h-3 text-slate-300" />
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={pointsPer10k}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        updateLoyalty('pointsPerRupiah', val / 10000);
                                    }}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-purple-600 pr-12"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8B7E66]">PTS</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest flex items-center gap-1">
                                Nilai Tukar Poin <Info className="w-3 h-3 text-slate-300" />
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8B7E66]">Rp</span>
                                <input
                                    type="number"
                                    value={loyalty.pointValueInRupiah || 100}
                                    onChange={(e) => updateLoyalty('pointValueInRupiah', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-10 py-3 text-sm font-black focus:outline-none focus:border-purple-600"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic">Nilai Rupiah yang didapat pelanggan per 1 poin saat ditukar.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">Masa Berlaku Poin</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={loyalty.pointExpiryDays}
                                    onChange={(e) => updateLoyalty('pointExpiryDays', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-purple-600 pr-16"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8B7E66]">HARI</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic">Poin akan otomatis hangus setelah masa berlaku habis.</p>
                        </div>
                    </div>
                </div>

                {/* Tier Thresholds */}
                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-wider">Ambang Batas Tier</h4>
                            <p className="text-[10px] text-[#8B7E66] font-medium">Total belanja untuk naik level</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {['SILVER', 'GOLD', 'PLATINUM'].map((tier) => (
                            <div key={tier} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${tier === 'SILVER' ? 'bg-slate-300' :
                                            tier === 'GOLD' ? 'bg-amber-400' : 'bg-purple-500'
                                            }`} />
                                        {tier} Threshold
                                    </label>
                                    <span className="text-[9px] font-black text-emerald-600">IDR</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={loyalty.tierThresholds[tier]}
                                        onChange={(e) => updateTier(tier, parseInt(e.target.value) || 0)}
                                        className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-emerald-600"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 group-hover:opacity-100">
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-4 items-start">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                    <Info size={16} />
                </div>
                <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-amber-900 uppercase">Penting!</h5>
                    <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                        Perubahan aturan loyalitas hanya akan berlaku untuk transaksi <b>mendatang</b>. Poin yang sudah dimiliki pelanggan dan status tier saat ini tidak akan berubah secara otomatis.
                    </p>
                </div>
            </div>
        </section>
    );
}
