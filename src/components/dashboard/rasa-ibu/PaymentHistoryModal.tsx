'use client';

import React, { useEffect, useState } from 'react';
import { getAllPaymentProofsAction } from '@/lib/actions/rasa-ibu/qris';
import { History, X, Search, Eye, CheckCircle2, Clock, Filter, Receipt, Loader2, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentHistoryModalProps {
    brandId: string;
    onClose: () => void;
}

export default function PaymentHistoryModal({ brandId, onClose }: PaymentHistoryModalProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const loadData = async () => {
        setIsLoading(true);
        const res = await getAllPaymentProofsAction(brandId);
        if (res.success) {
            setPayments(res.data);
        } else {
            toast.error('Gagal memuat riwayat: ' + res.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
            p.customerName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'VERIFIED' && p.isVerified) ||
            (statusFilter === 'PENDING' && !p.isVerified);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-12 py-8 border-b border-[#F9F7F2] bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <History className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-[#2D3A2D] tracking-tighter uppercase leading-none">Riwayat Transaksi</h2>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-1">Audit Bukti Pembayaran Masuk</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {payments.length > 0 && (
                            <div className="hidden md:flex bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 items-center gap-3">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{payments.length} Data Transaksi</span>
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-full transition-all shadow-sm"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Filters Hub */}
                <div className="px-12 py-6 bg-white/40 border-b border-[#E5E1D8] flex flex-col md:flex-row gap-6 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Invoice atau Nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white/80 border border-[#E5E1D8] rounded-[1.5rem] text-sm font-bold text-[#2D3A2D] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="flex bg-white/80 p-1.5 rounded-[1.5rem] border border-[#E5E1D8] backdrop-blur-sm">
                        {[
                            { id: 'ALL', label: 'Semua', icon: Filter },
                            { id: 'VERIFIED', label: 'Valid', icon: CheckCircle2 },
                            { id: 'PENDING', label: 'Pending', icon: Clock }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id as any)}
                                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === f.id
                                    ? 'bg-[#2D3A2D] text-white shadow-xl shadow-stone-900/10'
                                    : 'text-[#8B7E66] hover:bg-slate-50'
                                    }`}
                            >
                                <f.icon className="w-3.5 h-3.5" />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 bg-[#FDFBF7]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Menyinkronkan Audit...</p>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-30">
                            <div className="p-8 bg-slate-100 rounded-[2.5rem]">
                                <Receipt className="w-16 h-16 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-[#2D3A2D]">Audit Bersih</h3>
                                <p className="text-[#8B7E66] text-sm font-medium">Tidak ada transaksi yang perlu ditampilkan saat ini.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPayments.map((p) => (
                                <div key={p.id} className="group bg-white border border-[#E5E1D8] rounded-[3rem] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col relative shadow-sm">
                                    {/* Glassmorphic Badge */}
                                    <div className={`absolute top-6 left-6 z-10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border ${p.isVerified
                                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                                        : 'bg-amber-500/90 text-white border-amber-400'
                                        }`}>
                                        {p.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                        {p.isVerified ? 'VERIFIED' : 'WAITING'}
                                    </div>

                                    {/* Proof Image Wrapper */}
                                    <div
                                        className="h-56 bg-[#F9F7F2] relative cursor-pointer overflow-hidden border-b border-[#F9F7F2]"
                                        onClick={() => setSelectedProof(p.proof)}
                                    >
                                        <img src={p.proof} alt="Transaction Proof" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 transform scale-75 group-hover:scale-100 transition-transform">
                                                <Eye className="text-white w-8 h-8" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-6 right-6 bg-[#2D3A2D]/80 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
                                            {p.method || 'Transfer'}
                                        </div>
                                    </div>

                                    {/* Meta Information */}
                                    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-2">Ref: #{p.invoiceNo}</p>
                                                    <h4 className="text-xl font-black text-[#2D3A2D] truncate tracking-tight">{p.customerName || 'Bunda Anonim'}</h4>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-bold text-[#8B7E66] uppercase tracking-widest">Total Bayar</p>
                                                    <p className="text-lg font-black text-emerald-700">{currency.format(p.amount)}</p>
                                                </div>
                                                <div className="text-right space-y-0.5">
                                                    <p className="text-[9px] font-bold text-[#8B7E66] uppercase tracking-widest">Metode</p>
                                                    <p className="text-xs font-black text-[#2D3A2D]">{p.method}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 tracking-tight">
                                                {new Date(p.createdAt).toLocaleString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lightbox Enhancement */}
                {selectedProof && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-12 transition-all duration-300 group" onClick={() => setSelectedProof(null)}>
                        <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="absolute top-0 right-0 p-4">
                                <button
                                    onClick={() => setSelectedProof(null)}
                                    className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                            <img src={selectedProof} alt="Full Transaction Proof" className="max-w-full max-h-[85%] object-contain rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.1)] border border-white/10" />
                            <div className="mt-8 px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-4">
                                <span className="text-xs font-bold text-white/60 tracking-widest uppercase">Kualitas Bukti: Original</span>
                                <div className="h-4 w-px bg-white/10" />
                                <a
                                    href={selectedProof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    Unduh Berkas
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Insight */}
                <div className="p-8 bg-white border-t border-[#F9F7F2] mt-auto flex justify-between items-center shrink-0">
                    <button
                        onClick={loadData}
                        className="text-[10px] font-black text-[#8B7E66] hover:text-[#2D3A2D] transition-all flex items-center gap-3 uppercase tracking-widest group"
                    >
                        <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        Segarkan Data Audit
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <ShieldCheck size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Data Encrypted</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-300 italic hidden md:block">
                            Sistem Audit Otomatis v2.0 • Protokol Keamanan Berlaku
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
