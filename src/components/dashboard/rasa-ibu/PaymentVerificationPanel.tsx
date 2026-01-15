'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, Loader2, DollarSign, ShieldCheck, User, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPendingPaymentsAction, verifyPaymentAction, rejectPaymentAction } from '@/lib/actions/rasa-ibu/qris';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface PaymentVerificationPanelProps {
    brandId: string;
    onVerificationSuccess?: () => void;
}

export default function PaymentVerificationPanel({ brandId, onVerificationSuccess }: PaymentVerificationPanelProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const confirm = useConfirm();

    const loadPayments = async () => {
        setIsLoading(true);
        const res = await getPendingPaymentsAction(brandId);
        if (res.success) {
            setPayments(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, [brandId]);

    const handleVerify = async (paymentId: string) => {
        const confirmed = await confirm({
            title: 'Verifikasi Pembayaran?',
            message: 'Pastikan dana benar-benar sudah masuk ke rekening atau E-wallet Bunda sebelum memverifikasi.',
            confirmText: 'Ya, Verifikasi',
            cancelText: 'Cek Lagi',
            variant: 'info'
        });

        if (!confirmed) return;

        setIsActionLoading(true);
        try {
            const res = await verifyPaymentAction(paymentId, 'Staff Dapur'); // Replace with actual user name if available
            if (res.success) {
                toast.success('Pembayaran Terverifikasi!');
                setSelectedPayment(null);
                loadPayments();
                if (onVerificationSuccess) onVerificationSuccess();
            } else {
                toast.error('Gagal verifikasi: ' + res.error);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReject = async (paymentId: string) => {
        const reason = await confirm({
            title: 'Tolak Pembayaran?',
            message: 'Mohon masukkan alasan penolakan untuk diinfokan ke pelanggan.',
            confirmText: 'Tolak Pembayaran',
            cancelText: 'Batal',
            variant: 'danger',
            showInput: true,
            inputPlaceholder: 'Contoh: Nominal tidak sesuai, Bukti tidak jelas...'
        });

        if (!reason || typeof reason !== 'string') return;

        setIsActionLoading(true);
        try {
            const res = await rejectPaymentAction(paymentId, reason);
            if (res.success) {
                toast.success('Pembayaran Ditolak');
                setSelectedPayment(null);
                loadPayments();
                if (onVerificationSuccess) onVerificationSuccess();
            } else {
                toast.error('Gagal menolak: ' + res.error);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div suppressHydrationWarning className="bg-white border border-[#E5E1D8] rounded-[3rem] overflow-hidden shadow-sm shadow-stone-200/50 h-full flex flex-col min-h-[500px]">
            <div className="px-10 py-8 border-b border-[#F9F7F2] bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest leading-none">Verifikasi Pembayaran</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Antrean Pembayaran Menunggu</p>
                    </div>
                </div>
                {payments.length > 0 && (
                    <div className="bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-2">
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">{payments.length} Pending</span>
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    </div>
                )}
            </div>

            <div className="flex-1 divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest">Memuat Antrean...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-3 opacity-20">
                        <CheckCircle2 size={48} strokeWidth={1} />
                        <p className="text-xs font-black uppercase tracking-widest">Semua Terverifikasi</p>
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div
                            key={payment.id}
                            onClick={() => setSelectedPayment(payment)}
                            className={`px-10 py-6 flex items-start gap-4 hover:bg-[#FDFBF7] transition-all cursor-pointer group/item ${selectedPayment?.id === payment.id ? 'bg-[#F9F7F2]' : ''}`}
                        >
                            <div className="w-12 h-12 bg-white border border-[#E5E1D8] rounded-2xl overflow-hidden shadow-sm group-hover/item:scale-110 transition-transform flex items-center justify-center">
                                {payment.proofPath ? (
                                    <img src={payment.proofPath} alt="Proof Small" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-slate-200" size={20} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="text-sm font-black text-[#1A241A] truncate">{payment.order?.customerName || 'Anonymous'}</p>
                                    <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                        #{payment.order?.invoiceNo || payment.order?.id.slice(-6).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs font-black text-emerald-700">Rp {Number(payment.amount).toLocaleString('id-ID')}</p>
                                    <div className="h-1 w-1 bg-slate-300 rounded-full" />
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                        <Clock size={10} />
                                        {new Date(payment.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-emerald-600 hover:border-emerald-200 transition-all">
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Expanded View / Detail Overlay */}
            {selectedPayment && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <User size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-lg font-black text-[#2D3A2D] tracking-tighter">{selectedPayment.order?.customerName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verifikasi Pembayaran QRIS</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bukti Transfer</label>
                                    <div className="aspect-[3/4] bg-white border-2 border-[#E5E1D8] rounded-[2rem] overflow-hidden shadow-2xl group relative">
                                        <img src={selectedPayment.proofPath} alt="Full Proof" className="w-full h-full object-contain" />
                                        <a
                                            href={selectedPayment.proofPath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <span className="px-4 py-2 bg-white text-[10px] font-black uppercase rounded-xl shadow-lg">Lihat Ukuran Penuh</span>
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Seharusnya</label>
                                            <p className="text-3xl font-black text-[#2D3A2D] tracking-tighter">
                                                Rp {Number(selectedPayment.amount).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] space-y-3">
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Audit Checklist</span>
                                            </div>
                                            <ul className="space-y-2">
                                                {['Cek Nama Pengirim', 'Cek Tanggal & Jam', 'Cek Nominal Persis'].map((check, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-amber-800/60">
                                                        <div className="w-1 h-1 bg-amber-400 rounded-full" />
                                                        {check}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-10">
                                        <button
                                            onClick={() => handleVerify(selectedPayment.id)}
                                            disabled={isActionLoading}
                                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10"
                                        >
                                            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
                                            Verifikasi & Update Status
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedPayment.id)}
                                            disabled={isActionLoading}
                                            className="w-full py-5 text-rose-600 hover:bg-rose-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100 flex items-center justify-center gap-2"
                                        >
                                            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle size={16} />}
                                            Tolak Pembayaran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 bg-[#FDFBF7] border-t border-[#E5E1D8] mt-auto flex justify-between items-center shrink-0">
                <button
                    onClick={loadPayments}
                    className="text-[9px] font-black text-[#8B7E66] uppercase tracking-widest flex items-center gap-2 hover:text-[#2D3A2D] transition-colors"
                >
                    <Clock size={12} /> Segarkan Data
                </button>
                <div className="flex items-center gap-2 opacity-50">
                    <ShieldCheck size={12} className="text-blue-600" />
                    <span className="text-[9px] font-black text-[#8B7E66] uppercase tracking-widest">Encrypted</span>
                </div>
            </div>
        </div>
    );
}
