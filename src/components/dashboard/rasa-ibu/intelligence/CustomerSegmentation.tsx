'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserCheck, MessageCircle, Clock, DollarSign, ArrowRight, Loader2, Info, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getRFMSegmentationAction } from '@/lib/actions/rasa-ibu/intelligence';
import { exportToCSV } from '@/lib/utils/exportUtils';

interface CustomerSegmentationProps {
    brandId: string;
}

export default function CustomerSegmentation({ brandId }: CustomerSegmentationProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getRFMSegmentationAction(brandId);
            if (res.success) {
                setData(res.data);
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

        const template = cust.segment?.template || 'Halo Bunda {{name}}, apa kabar?';
        const message = template.replace('{{name}}', cust.name);

        const waUrl = `https://wa.me/${phone.startsWith('0') ? '62' + phone.substring(1) : phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-black text-[#8B7E66] uppercase tracking-widest">Menganalisis Loyalitas Pelanggan...</p>
            </div>
        );
    }

    if (!data || data.totalCustomers === 0) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                    <Users className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#2D3A2D]">Data Pelanggan Belum Teridentifikasi</h3>
                    <p className="text-[10px] text-[#8B7E66] font-medium max-w-[240px] mx-auto mt-2 leading-relaxed">
                        Sistem membutuhkan data transaksi dengan identitas pelanggan (Email/WA) untuk melakukan segmentasi.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Customer intelligence</h3>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Segmentasi RFM Pelanggan</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const exportData = data.topCustomers.map((cust: any) => ({
                                'Nama': cust.name,
                                'Segment': cust.segment?.name || 'N/A',
                                'Total Pesanan': cust.orders,
                                'Total Belanja': cust.spent,
                                'Terakhir Aktif (hari lalu)': cust.lastActive,
                                'WhatsApp': cust.id
                            }));
                            exportToCSV(exportData, 'RFM_Customer_Segmentation');
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                    <div className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-2xl shadow-sm text-center">
                        <p className="text-[8px] font-black text-[#8B7E66] uppercase">Total Database</p>
                        <p className="text-lg font-black text-[#2D3A2D]">{data.totalCustomers} Pelanggan</p>
                    </div>
                </div>
            </div>

            {/* Segment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {data.segments.map((segment: any, idx: number) => (
                    <div
                        key={idx}
                        className="bg-white rounded-[2rem] border border-[#E5E1D8] p-6 space-y-4 hover:shadow-xl transition-all duration-500 border-b-4 group"
                        style={{ borderBottomColor: segment.color }}
                    >
                        <div className="flex justify-between items-start">
                            <span
                                className="px-3 py-1 rounded-full text-[8px] font-black uppercase text-white"
                                style={{ backgroundColor: segment.color }}
                            >
                                {segment.name}
                            </span>
                            <p className="text-2xl font-black text-[#2D3A2D]">{segment.count}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#8B7E66] leading-relaxed group-hover:text-[#2D3A2D] transition-colors line-clamp-2">
                                {segment.description}
                            </p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[8px] font-black text-indigo-600 uppercase mb-1">Aksi Strategis:</p>
                            <p className="text-[10px] font-medium text-[#2D3A2D] italic">"{segment.action}"</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Top Spending Customers */}
                <div className="bg-[#2D3A2D] rounded-[3rem] p-10 text-[#FDFBF7] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Pilar Omzet (Top Buyers)</h4>
                            </div>
                            <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">One-Click CRM</span>
                        </div>
                        <div className="space-y-6">
                            {data.topCustomers.map((cust: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-black border border-white/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{cust.name}</p>
                                            <p className="text-[9px] text-[#B2BCA2] font-bold uppercase tracking-tighter">
                                                {cust.orders} Pesanan • Aktif {cust.lastActive} hari lalu
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-400">{currency.format(cust.spent)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleChat(cust)}
                                            className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-900/20"
                                            title="Kirim Pesan WhatsApp Otomatis"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Strategy Summary */}
                <div className="bg-white rounded-[3rem] border border-[#E5E1D8] p-10 shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Evaluasi Retensi Pelanggan</h4>
                        </div>
                        <div className="space-y-6">
                            <p className="text-sm font-medium text-[#8B7E66] leading-relaxed">
                                Berdasarkan analisis RFM, basis pelanggan Bunda didominasi oleh segmen <span className="text-[#2D3A2D] font-black italic">"{data.segments.sort((a: any, b: any) => b.count - a.count)[0]?.name}"</span>.
                            </p>
                            <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                                <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Rekomendasi Utama</p>
                                <p className="text-xs font-medium text-[#2D3A2D] leading-relaxed italic">
                                    "Fokus pada pelanggan <b>At Risk</b> ({data.segments.find((s: any) => s.name === 'At Risk')?.count || 0} orang) dengan mengirimkan draf pesan 'Kangen' yang sudah saya siapkan untuk memicu pesanan kembali."
                                </p>
                            </div>
                        </div>
                    </div>
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-8">
                        Analisis Campaign Lengkap <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
