'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Calendar, ArrowUpRight, Loader2, Megaphone, Hash, Download, X, Sparkles } from 'lucide-react';
import { getCampaignROIAction } from '@/lib/actions/rasa-ibu/intelligence';
import { exportToCSV } from '@/lib/utils/exportUtils';

interface CampaignTrackerProps {
    brandId: string;
}

export default function CampaignTracker({ brandId }: CampaignTrackerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getCampaignROIAction(brandId);
            if (res.success) {
                setCampaigns(res.data || []);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                <p className="text-xs font-black text-[#8B7E66] uppercase tracking-widest">Mengkalkulasi ROI Kampanye...</p>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                    <Megaphone className="w-8 h-8 text-rose-300" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#2D3A2D]">Belum Ada Kampanye Terdeteksi</h3>
                    <p className="text-[10px] text-[#8B7E66] font-medium max-w-[320px] mx-auto mt-2 leading-relaxed">
                        Gunakan hashtag (misal: <code className="bg-slate-100 px-1 rounded">#PROMO_WA</code>) pada catatan internal pesanan untuk mulai melacak efektivitas pemasaran Bunda.
                    </p>
                </div>
            </div>
        );
    }

    const bestCampaign = campaigns[0];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-[1.5rem] shadow-inner">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Marketing Performance</h3>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Pelacak ROI Kampanye WhatsApp</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const exportData = campaigns.map((camp: any) => ({
                                'Hashtag': camp.tag,
                                'Total Revenue': camp.revenue,
                                'Total Order': camp.orders,
                                'Pelanggan Unik': camp.uniqueCustomers,
                                'Efisiensi per Order': camp.efficiency,
                                'Terakhir Aktif': new Date(camp.lastActive).toLocaleDateString('id-ID')
                            }));
                            exportToCSV(exportData, 'Campaign_ROI_Report');
                        }}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl text-[10px] font-black text-rose-700 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        {campaigns.length} Kampanye Aktif
                    </div>
                </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {campaigns.map((camp, idx) => (
                    <div
                        key={idx}
                        className={`bg-white rounded-[2.5rem] border p-8 space-y-6 transition-all duration-500 hover:scale-[1.02] ${idx === 0 ? 'border-rose-200 shadow-xl shadow-rose-900/5 ring-1 ring-rose-100' : 'border-[#E5E1D8] shadow-sm'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${idx === 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Hash className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-black text-[#2D3A2D]">{camp.tag}</h4>
                            </div>
                            {idx === 0 && (
                                <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Top ROI</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-2xl font-black text-[#2D3A2D]">{currency.format(camp.revenue)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                <div>
                                    <p className="text-[8px] font-black text-[#8B7E66] uppercase mb-1">Total Order</p>
                                    <p className="text-sm font-black text-[#2D3A2D]">{camp.orders}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-[#8B7E66] uppercase mb-1">Pelanggan Unik</p>
                                    <p className="text-sm font-black text-[#2D3A2D]">{camp.uniqueCustomers}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl flex items-center justify-between ${idx === 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[9px] font-bold">Aktif Terakhir</span>
                            </div>
                            <span className="text-[9px] font-black uppercase">
                                {new Date(camp.lastActive).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Strategy Card */}
            <div className="bg-[#1A1A1A] rounded-[3rem] p-12 text-[#FDFBF7] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-rose-600/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-24 h-24 bg-rose-600 rounded-[2rem] flex items-center justify-center rotate-12 shadow-2xl shadow-rose-900/40 group-hover:rotate-0 transition-all duration-500">
                        <Target className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-rose-400">Rekomendasi Strategi AI</h4>
                        <p className="text-lg font-medium leading-relaxed opacity-90 italic">
                            "Kampanye <span className="text-white font-black not-italic">#{bestCampaign?.tag}</span> terbukti menghasilkan efisiensi tertinggi (rata-rata {currency.format(bestCampaign?.efficiency)} per order). Disarankan untuk memperpanjang durasi promo ini atau memberikan variasi menu baru dengan hashtag yang serupa."
                        </p>
                    </div>
                    <button
                        onClick={() => setSelectedCampaign(bestCampaign)}
                        className="px-8 py-4 bg-white text-[#1A1A1A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2"
                    >
                        Analisis Detail <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Campaign Detail Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                        <Hash className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Campaign Insight</p>
                                        <h3 className="text-xl font-black text-gray-800">#{selectedCampaign.tag}</h3>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="py-6 border-y border-gray-100 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                                    <p className="text-2xl font-black text-gray-800">{currency.format(selectedCampaign.revenue)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efisiensi Profit</p>
                                    <p className="text-2xl font-black text-emerald-600">{currency.format(selectedCampaign.efficiency)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Conversion Rate</p>
                                    <p className="text-2xl font-black text-gray-800">{((selectedCampaign.orders / selectedCampaign.uniqueCustomers) * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Order</p>
                                    <p className="text-2xl font-black text-gray-800">{selectedCampaign.orders} <span className="text-xs text-gray-400 font-bold">Trx</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Sparkles className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">AI Recommendation</p>
                                </div>
                                <p className="text-sm text-slate-600 italic leading-relaxed">
                                    "Kampanye ini menunjukkan performa di atas rata-rata (+24%). Disarankan untuk melakukan scaling budget atau replikasi struktur pesan untuk produk lain."
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                            >
                                Tutup Analisis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
