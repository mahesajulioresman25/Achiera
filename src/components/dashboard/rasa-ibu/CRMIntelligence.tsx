'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, MessageCircle, TrendingUp, Star, Clock, AlertCircle, ExternalLink, RefreshCcw, X, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { getRFMSegmentation } from '@/lib/intelligence/financeEngine';

interface CRMIntelligenceProps {
    brandId: string;
    onClose: () => void;
}

export default function CRMIntelligence({ brandId, onClose }: CRMIntelligenceProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

    useEffect(() => {
        const loadCRM = async () => {
            setIsLoading(true);
            const res = await getRFMSegmentation(brandId);
            if (res.success) setData(res.data);
            setIsLoading(false);
        };
        loadCRM();
    }, [brandId]);

    const handleWhatsApp = (customer: any) => {
        const segment = data.segments.find((s: any) => s.name === customer.segment.name);
        if (!segment) return;

        let template = segment.template || "Halo Bunda {{name}}, apa kabar? 😊";
        const message = template.replace('{{name}}', customer.name);

        const phone = customer.id.startsWith('anon-') ? '' : customer.id.replace(/\D/g, '');
        if (!phone) {
            toast.error("Nomor WhatsApp tidak ditemukan!");
            return;
        }

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const filteredCustomers = selectedSegment
        ? data?.topCustomers?.filter((c: any) => c.segment.name === selectedSegment)
        : data?.topCustomers;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-[#E5E1D8] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-rose-50 rounded-2xl">
                            <Heart className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Kangen Bunda CRM</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Kecerdasan Hubungan Pelanggan</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menganalisa Perasaan Pelanggan Bunda...</p>
                        </div>
                    ) : !data || data.totalCustomers === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <Users className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Belum ada cukup pelanggan untuk dianalisa.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Segment Cards */}
                            <div className="grid grid-cols-5 gap-4">
                                {data.segments.map((segment: any) => (
                                    <button
                                        key={segment.name}
                                        onClick={() => setSelectedSegment(selectedSegment === segment.name ? null : segment.name)}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 active:scale-95 ${selectedSegment === segment.name
                                            ? 'border-rose-500 bg-rose-50'
                                            : 'border-transparent bg-white shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: segment.color }}>
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-2xl font-black text-[#2D3A2D]">{segment.count}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: segment.color }}>{segment.name}</p>
                                        </div>
                                        <p className="text-[8px] font-medium text-slate-400 leading-tight">{segment.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Campaign Recommendation */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex items-start gap-8">
                                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center shrink-0">
                                    <Star className="w-10 h-10 text-rose-500" />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Rekomendasi Kampanye</span>
                                        <h3 className="text-xl font-black text-[#2D3A2D]">"Bunda Kangen Menu Spesial"</h3>
                                    </div>
                                    <p className="text-sm text-[#8B7E66] leading-relaxed">
                                        Ada <span className="font-bold text-[#2D3A2D]">{data.segments.find((s: any) => s.name === 'Hibernating')?.count || 0} Bunda</span> yang sudah tidak belanja lebih dari 60 hari.
                                        Sistem merekomendasikan untuk mengirimkan pesan "Kangen" dengan diskon 10% agar mereka kembali belanja.
                                    </p>
                                    <button className="px-6 py-2.5 bg-[#2D3A2D] text-[#FDFBF7] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1A241A] transition-all">
                                        Mulai Kampanye Skala Besar
                                    </button>
                                </div>
                            </div>

                            {/* Customer List */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end px-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">Daftar Follow-up Bunda</h4>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Klik tombol WA untuk mengirimkan pesan otomatis sesuai segmen.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedSegment && (
                                            <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[8px] font-black uppercase">Filter: {selectedSegment}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-[#E5E1D8] overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
                                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <th className="px-8 py-5">Nama Bunda</th>
                                                <th className="px-8 py-5">Segmen</th>
                                                <th className="px-8 py-5 text-center">Total Order</th>
                                                <th className="px-8 py-5 text-center">Terakhir Aktif</th>
                                                <th className="px-8 py-5 text-right">Aksi Pintar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredCustomers?.map((customer: any) => (
                                                <tr key={customer.id} className="hover:bg-rose-50/10 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-black text-[#2D3A2D] uppercase tracking-tight">{customer.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-medium">{customer.id.includes('anon-') ? 'Nomor via Website' : customer.id}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: customer.segment.color }}>
                                                            {customer.segment.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-center text-xs font-bold text-[#2D3A2D]">
                                                        {customer.orders}x
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs font-bold text-slate-500">{customer.lastActive} Hari</span>
                                                            <span className="text-[8px] text-slate-300 font-bold uppercase italic">Yang Lalu</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => handleWhatsApp(customer)}
                                                            className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            Kirim Follow-up
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
