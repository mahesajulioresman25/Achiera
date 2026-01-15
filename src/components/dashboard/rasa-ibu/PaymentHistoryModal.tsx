'use client';

import React, { useEffect, useState } from 'react';
import { getAllPaymentProofsAction } from '@/lib/actions/rasa-ibu/qris';
import { History, X, Search, Eye, CheckCircle2, XCircle, Clock, Filter, Receipt } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-12 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                            <History className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Audit Transaksi</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">Riwayat Bukti Bayar</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-12 py-6 bg-white/50 border-b border-[#E5E1D8] flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Invoice atau Nama Pelanggan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-[#E5E1D8]">
                        {[
                            { id: 'ALL', label: 'Semua', icon: Filter },
                            { id: 'VERIFIED', label: 'Terverifikasi', icon: CheckCircle2 },
                            { id: 'PENDING', label: 'Menunggu', icon: Clock }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id as any)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === f.id
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-[#8B7E66] hover:bg-slate-50'
                                    }`}
                            >
                                <f.icon className="w-3 h-3" />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12 bg-[#FDFBF7]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Memuat Data Riwayat...</p>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="p-6 bg-slate-100 rounded-full">
                                <Receipt className="w-12 h-12 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#2D3A2D]">Tidak Ditemukan</h3>
                                <p className="text-slate-400 text-sm">Belum ada riwayat bukti pembayaran yang sesuai.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPayments.map((p) => (
                                <div key={p.id} className="group bg-white border border-[#E5E1D8] rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col">
                                    {/* Proof Preview */}
                                    <div
                                        className="h-48 bg-slate-100 relative cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedProof(p.proof)}
                                    >
                                        <img src={p.proof} alt="Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                                                <Eye className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${p.isVerified
                                                ? 'bg-emerald-500 text-white border-emerald-400'
                                                : 'bg-amber-500 text-white border-amber-400'
                                            }`}>
                                            {p.isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {p.isVerified ? 'VERIFIED' : 'PENDING'}
                                        </div>
                                        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-bold text-white uppercase tracking-wider">
                                            {p.method}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-1">#{p.invoiceNo}</p>
                                                    <h4 className="text-lg font-black text-[#2D3A2D] truncate">{p.customerName}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-indigo-600">{currency.format(p.amount)}</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-50">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-[#2D3A2D] transition-colors">
                                                    <span className="uppercase tracking-widest">Waktu Transaksi</span>
                                                    <span>{new Date(p.createdAt).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Proof Lightbox */}
                {selectedProof && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300" onClick={() => setSelectedProof(null)}>
                        <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                            <img src={selectedProof} alt="Full Proof" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                            <button className="absolute -top-12 right-0 md:-right-12 text-white/60 hover:text-white transition-colors">
                                <X className="w-10 h-10" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
