'use client';

import React, { useState } from 'react';
import {
    X,
    ArrowRight,
    DollarSign,
    Package,
    ShieldCheck,
    Loader2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { createInterBrandTransferAction } from '@/lib/actions/holding';

interface ResourceTransferModalProps {
    brands: Array<{ name: string; slug: string; id?: string }>;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResourceTransferModal({ brands, onClose, onSuccess }: ResourceTransferModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        sendingBrandId: '',
        receivingBrandId: '',
        type: 'CASH' as 'CASH' | 'STOCK' | 'SERVICE',
        value: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sendingBrandId || !formData.receivingBrandId || !formData.value) {
            setError('Semua field wajib diisi');
            return;
        }

        if (formData.sendingBrandId === formData.receivingBrandId) {
            setError('Brand pengirim dan penerima tidak boleh sama');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await createInterBrandTransferAction({
                ...formData,
                value: parseFloat(formData.value)
            });

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.error || 'Gagal mencatat transfer');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1A241A]/60 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-[#F9F7F2] flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-[#1A241A] tracking-tighter">
                            Record <span className="text-amber-600">Resource Transfer</span>
                        </h3>
                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest mt-1">Inter-Brand Asset Movement</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F9F7F2] rounded-xl transition-all">
                        <X className="w-6 h-6 text-[#8B7E66]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Sending Brand */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[#8B7E66] tracking-widest block ml-1">Dari Brand</label>
                            <select
                                value={formData.sendingBrandId}
                                onChange={(e) => setFormData({ ...formData, sendingBrandId: e.target.value })}
                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl p-4 text-sm font-bold text-[#1A241A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none"
                            >
                                <option value="">Pilih Brand...</option>
                                {brands.map(b => (
                                    <option key={b.slug} value={b.slug}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Receiving Brand */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[#8B7E66] tracking-widest block ml-1">Ke Brand</label>
                            <select
                                value={formData.receivingBrandId}
                                onChange={(e) => setFormData({ ...formData, receivingBrandId: e.target.value })}
                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl p-4 text-sm font-bold text-[#1A241A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none"
                            >
                                <option value="">Pilih Brand...</option>
                                {brands.map(b => (
                                    <option key={b.slug} value={b.slug}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[#8B7E66] tracking-widest block ml-1">Jenis Sumber Daya</label>
                            <div className="flex bg-[#FDFBF7] p-1 rounded-2xl border border-[#E5E1D8]">
                                {(['CASH', 'STOCK', 'SERVICE'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t })}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === t
                                                ? 'bg-[#2D3A2D] text-white shadow-lg'
                                                : 'text-[#8B7E66] hover:bg-white'
                                            }`}
                                    >
                                        {t === 'CASH' && <DollarSign className="w-3 h-3 mx-auto mb-1" />}
                                        {t === 'STOCK' && <Package className="w-3 h-3 mx-auto mb-1" />}
                                        {t === 'SERVICE' && <RefreshCw className="w-3 h-3 mx-auto mb-1" />}
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Value */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[#8B7E66] tracking-widest block ml-1">Nilai (Rp)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl p-4 text-sm font-bold text-[#1A241A] placeholder:text-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#8B7E66] tracking-widest block ml-1">Keterangan / Alasan</label>
                        <textarea
                            rows={3}
                            placeholder="Misal: Suntikan modal awal, Pinjam stok 50pcs Rendang, Jasa IT..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl p-4 text-sm font-bold text-[#1A241A] placeholder:text-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-[#2D3A2D] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-900/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Record Transfer
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
