'use client';

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, UserCheck, DollarSign, Loader2, Sparkles, ArrowRight, MessageCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerLTVAction } from '@/lib/actions/rasa-ibu/intelligence';
import { exportToCSV } from '@/lib/utils/exportUtils';

interface LTVForecastProps {
    brandId: string;
}

export default function LTVForecast({ brandId }: LTVForecastProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getCustomerLTVAction(brandId);
            if (res.success) {
                setStats(res.data);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const handleChat = (cust: any) => {
        const phone = cust.id.replace(/\D/g, '');
        if (!phone || phone.length < 5) {
            toast.error('Nomor WhatsApp tidak valid untuk pelanggan ini.');
            return;
        }

        const template = cust.template || 'Halo Bunda {{name}}, apa kabar?';
        const message = template.replace('{{name}}', cust.name);

        const waUrl = `https://wa.me/${phone.startsWith('0') ? '62' + phone.substring(1) : phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-xs font-black text-[#8B7E66] uppercase tracking-widest">Memproses Ramalan Masa Depan...</p>
            </div>
        );
    }

    if (!stats || stats.customers?.length === 0) return null;

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.5rem] shadow-inner">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Predictive Analytics</h3>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Customer Lifetime Value (LTV)</h2>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const exportData = stats.customers.map((cust: any) => ({
                            'Nama': cust.name,
                            'Predicted LTV': cust.predictedLTV,
                            'Risk Level': cust.risk,
                            'Recency (hari)': cust.recencyDays,
                            'Total Orders': cust.orders || 0,
                            'Total Spent': cust.spent || 0,
                            'WhatsApp': cust.id
                        }));
                        exportToCSV(exportData, 'Customer_LTV_Prediction');
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Prediction Summary */}
                <div className="lg:col-span-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Potensi Revenue (12 Bln)</p>
                            <h3 className="text-4xl font-black tracking-tighter">{currency.format(stats.totalPotential)}</h3>
                        </div>
                        <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <p className="text-[10px] font-black uppercase mb-1">Nilai Rata-rata per Orang</p>
                            <p className="text-xl font-black">{currency.format(stats.avgLTV)}</p>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-90 italic">
                            *Prediksi berdasarkan data belanja historis dan frekuensi transaksi Bunda di sistem.
                        </p>
                    </div>
                </div>

                {/* VIPs at Risk */}
                <div className="lg:col-span-8 bg-white rounded-[3rem] border border-[#E5E1D8] p-10 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Target Retention: VIP at Risk</h4>
                        <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[8px] font-black rounded-full uppercase">Perlu Perhatian Segera</div>
                    </div>

                    <div className="space-y-4">
                        {stats.customers.filter((c: any) => c.risk !== 'LOW').slice(0, 4).map((cust: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${cust.risk === 'HIGH' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {cust.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-[#2D3A2D]">{cust.name}</p>
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${cust.risk === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                {cust.risk} RISK
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-400 font-bold">{cust.recencyDays} hari absen</span>
                                            <span className="text-[9px] text-slate-300">•</span>
                                            <span className="text-[9px] text-emerald-600 font-black">LTV: {currency.format(cust.predictedLTV)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleChat(cust)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        Chat Bunda
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-[10px] font-medium text-slate-500 italic text-center">
                            "Mencegah pelanggan VIP pergi jauh lebih murah 5x lipat daripada mencari pelanggan baru. Klik tombol chat di atas untuk mengirimkan pesan kangen pribadi."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
