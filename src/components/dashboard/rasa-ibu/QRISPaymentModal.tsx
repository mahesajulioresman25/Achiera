'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, Loader2, QrCode, DollarSign, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getQRISInfoAction, uploadPaymentProofAction } from '@/lib/actions/rasa-ibu/qris';

interface QRISPaymentModalProps {
    order: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QRISPaymentModal({ order, onClose, onSuccess }: QRISPaymentModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadQRIS() {
            const res = await getQRISInfoAction(order.brandId);
            if (res.success) {
                setQrisImageUrl(res.qrisImageUrl);
            }
            setIsLoading(false);
        }
        loadQRIS();
    }, [order.brandId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.[0]) {
            toast.error('Pilih bukti pembayaran terlebih dahulu');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', fileInputRef.current.files[0]);

        try {
            const res = await uploadPaymentProofAction(order.id, formData);
            if (res.success) {
                toast.success('Bukti pembayaran berhasil diunggah! Staff kami akan segera memverifikasi.');
                onSuccess();
            } else {
                toast.error('Gagal mengunggah: ' + res.error);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengunggah');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
                <div className="px-10 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-left">
                            <QrCode className="w-5 h-5 text-left" />
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] text-left">Pembayaran Pesanan</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D] uppercase tracking-tighter text-left">QRIS Dynamic</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side: QR Code and Order Info */}
                        <div className="space-y-8">
                            <div className="bg-white border border-[#E5E1D8] rounded-[2.5rem] p-10 space-y-6 shadow-sm flex flex-col items-center text-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pembayaran</p>
                                    <h3 className="text-4xl font-black text-emerald-900 tracking-tighter">
                                        Rp {(Number(order.totalAmount || order.total || 0)).toLocaleString('id-ID')}
                                    </h3>
                                </div>

                                <div className="p-6 bg-[#F9F7F2] rounded-[2rem] border-2 border-[#E5E1D8] relative group">
                                    {qrisImageUrl ? (
                                        <img src={qrisImageUrl} alt="QRIS" className="w-[200px] h-[200px] object-contain mix-blend-multiply" />
                                    ) : (
                                        <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-300">
                                            <QrCode size={100} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 border-[10px] border-white/50 pointer-events-none rounded-[1.5rem]" />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Invoice</p>
                                    <p className="text-xs font-black text-[#2D3A2D] bg-[#F9F7F2] px-4 py-1.5 rounded-full border border-[#E5E1D8]">
                                        #{order.invoiceNo || order.id.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex gap-4 text-left">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                                <div className="space-y-1 text-left">
                                    <p className="text-[10px] font-black text-blue-900 uppercase text-left">Petunjuk Pembayaran</p>
                                    <p className="text-[11px] text-blue-800/70 leading-relaxed font-medium text-left">
                                        Scan QR dengan M-Banking atau E-Wallet (Gopay/OVO/ShopeePay). Pastikan nominal sesuai dengan yang tertera di atas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Upload Proof */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#F9F7F2] pb-4">
                                    <Upload className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Kirim Bukti Pembayaran</h3>
                                </div>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative aspect-video bg-white border-2 border-dashed border-[#E5E1D8] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center hover:bg-[#F9F7F2] transition-all cursor-pointer group"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Proof" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="w-16 h-16 bg-[#F9F7F2] text-emerald-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1 px-10">
                                                <p className="text-xs font-black text-[#2D3A2D] uppercase tracking-wider">Tap untuk upload bukti</p>
                                                <p className="text-[10px] text-slate-400 font-medium italic">Format: PNG, JPG (Maks. 5MB)</p>
                                            </div>
                                        </div>
                                    )}

                                    {previewUrl && (
                                        <div className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-emerald-600 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload size={16} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !previewUrl}
                                className={`w-full py-6 flex items-center justify-center gap-4 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-900/10 ${previewUrl
                                        ? 'bg-[#2D3A2D] text-white hover:scale-[1.02] active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    }`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sedang Mengunggah...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Kirim untuk Verifikasi
                                    </>
                                )}
                            </button>

                            <div className="p-8 bg-[#F9F7F2] rounded-[2.5rem] border border-[#E5E1D8] space-y-4">
                                <h4 className="text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                                    Security Promise
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        'Data anda dienkripsi secara aman',
                                        'Diverifikasi langsung oleh Finance Staff',
                                        'Notifikasi otomatis via WhatsApp'
                                    ].map((item, i) => (
                                        <li key={i} className="text-[10px] font-bold text-[#8B7E66] flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-emerald-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-6 bg-white border-t border-[#E5E1D8] text-center">
                    <p className="text-[9px] text-slate-400 font-medium">
                        Butuh bantuan? Hubungi Admin via WhatsApp atau Email Support.
                    </p>
                </div>
            </div>
        </div>
    );
}
