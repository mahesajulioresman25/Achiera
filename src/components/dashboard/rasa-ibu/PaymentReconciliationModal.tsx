'use client';

import React, { useEffect, useState } from 'react';
import { getPendingReconciliationsAction, verifyPaymentAction, rejectPaymentAction } from '@/lib/actions/rasa-ibu/finance';
import { BadgeCheck, X, AlertCircle, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';
import Image from 'next/image';

interface PaymentReconciliationModalProps {
    brandId: string;
    onClose: () => void;
}

export default function PaymentReconciliationModal({ brandId, onClose }: PaymentReconciliationModalProps) {
    const [reconciliations, setReconciliations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const confirm = useConfirm();

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const loadData = async () => {
        setIsLoading(true);
        const res = await getPendingReconciliationsAction(brandId);
        if (res.success) {
            setReconciliations(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const handleVerify = async (id: string, orderId: string) => {
        const confirmed = await confirm({
            title: 'Konfirmasi Pembayaran',
            message: `Bunda yakin pembayaran untuk Pesanan #${orderId.slice(-4)} sudah sesuai?`,
            confirmText: 'Ya, Sesuai',
            cancelText: 'Batal',
            variant: 'info'
        });

        if (!confirmed) return;

        // Optimistic update
        setReconciliations(prev => prev.filter(r => r.id !== id));

        const res = await verifyPaymentAction(id, 'CURRENT_USER'); // TODO: Get actual user ID
        if (!res.success) {
            toast.error('Gagal memverifikasi pembayaran: ' + res.error);
            loadData(); // Revert
        }
    };

    const handleReject = async (id: string, orderId: string) => {
        const reason = await confirm({
            title: 'Tolak Rekonsiliasi?',
            message: `Berikan alasan penolakan untuk Pesanan #${orderId.slice(-4)} agar pelanggan tahu apa yang salah.`,
            confirmText: 'Tolak Pembayaran',
            cancelText: 'Batal',
            variant: 'danger',
            showInput: true,
            inputPlaceholder: 'Alasan penolakan...'
        });

        if (!reason || typeof reason !== 'string') return;

        setReconciliations(prev => prev.filter(r => r.id !== id));

        const res = await rejectPaymentAction(id, reason, 'CURRENT_USER');
        if (!res.success) {
            toast.error('Gagal menolak pembayaran: ' + res.error);
            loadData();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-12 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-50 rounded-2xl">
                            <BadgeCheck className="w-8 h-8 text-[#8B7E66]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Verifikasi Pembayaran</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">Reconciliation Desk</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12 bg-white relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-amber-200 border-t-[#8B7E66] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Memeriksa Antrian...</p>
                        </div>
                    ) : reconciliations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                            <div className="p-6 bg-[#F9F7F2] rounded-full">
                                <Check className="w-12 h-12 text-[#B2BCA2]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#2D3A2D]">Semua Beres!</h3>
                                <p className="text-slate-400 mt-2">Tidak ada pembayaran yang perlu diverifikasi saat ini.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reconciliations.map((item) => (
                                <div key={item.id} className="bg-white border border-[#E5E1D8] rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-8 items-start">
                                    {/* Proof Preview */}
                                    <div className="w-full md:w-48 h-48 bg-slate-100 rounded-2xl relative overflow-hidden group flex-shrink-0 cursor-pointer" onClick={() => setSelectedProof(item.paymentProof)}>
                                        {item.paymentProof ? (
                                            <img src={item.paymentProof} alt="Proof" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-300 italic text-xs">No Image</div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Eye className="text-white w-6 h-6" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-1">Pesanan #{item.order.invoiceNo}</p>
                                                <h3 className="text-2xl font-black text-[#2D3A2D]">{item.order.customerName}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nominal</p>
                                                <p className="text-2xl font-black text-[#2D3A2D]">{currency.format(Number(item.amount))}</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#F9F7F2] p-4 rounded-xl flex gap-8 text-xs">
                                            <div>
                                                <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Bank Tujuan</span>
                                                <span className="font-bold text-[#2D3A2D]">{item.bankAccount || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Metode</span>
                                                <span className="font-bold text-[#2D3A2D]">{item.paymentMethod}</span>
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Waktu Upload</span>
                                                <span className="font-bold text-[#2D3A2D]">{new Date(item.createdAt).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => handleVerify(item.id, item.order.id)}
                                                className="flex-1 bg-[#2D3A2D] text-[#FDFBF7] py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                            >
                                                Verifikasi Valid
                                            </button>
                                            <button
                                                onClick={() => handleReject(item.id, item.order.id)}
                                                className="px-8 bg-white border border-red-100 text-red-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Proof Lightbox */}
                {selectedProof && (
                    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-10" onClick={() => setSelectedProof(null)}>
                        <img src={selectedProof} alt="Full Proof" className="max-w-full max-h-full object-contain rounded-lg" />
                        <button className="absolute top-8 right-8 text-white hover:text-red-400">
                            <X className="w-10 h-10" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
