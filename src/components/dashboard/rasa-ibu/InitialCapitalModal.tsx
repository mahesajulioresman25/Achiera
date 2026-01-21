'use client';

import React from 'react';
import { X, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { recordInitialCapitalAction } from '@/lib/actions/rasa-ibu/finance';
import { toast } from 'sonner';

interface InitialCapitalModalProps {
    brandId: string;
    onClose: () => void;
}

export default function InitialCapitalModal({ brandId, onClose }: InitialCapitalModalProps) {
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        amount: '',
        assetAccount: '1-1001',
        description: 'Setoran Modal Awal'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Jumlah modal harus valid');
            return;
        }

        setLoading(true);
        const res = await recordInitialCapitalAction(
            brandId,
            amount,
            formData.assetAccount,
            formData.description
        );

        if (res.success) {
            toast.success('Modal awal berhasil dicatat');
            onClose();
        } else {
            toast.error(res.error || 'Gagal mencatat modal');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] rounded-[3rem] w-full max-w-md relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-[#E5E1D8] flex items-center justify-between bg-white/50">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A241A] tracking-tighter flex items-center gap-2">
                            <span className="bg-emerald-100 p-2 rounded-xl">💰</span>
                            Pencatatan <span className="text-emerald-600">Modal Awal</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-xl transition-all">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Jumlah Modal (IDR)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#2D3A2D]">Rp</span>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5E1D8] rounded-2xl text-xl font-black text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Akun Tujuan</label>
                        <select
                            value={formData.assetAccount}
                            onChange={(e) => setFormData({ ...formData, assetAccount: e.target.value })}
                            className="w-full px-4 py-4 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                        >
                            <option value="1-1001">1-1001 - Kas Besar</option>
                            <option value="1-1100">1-1100 - Bank BCA</option>
                            <option value="1-1101">1-1101 - Bank Mandiri</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Keterangan</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-4 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                            Transaksi ini akan mendebit akun Aset dan mengkredit akun <span className="underline">3-1000 Modal Disetor</span> secara otomatis.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : (
                            <>
                                Simpan Modal Awal
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
