'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Loader2, Check } from 'lucide-react';
import { recordIncomeAction, getLedgerAccountsAction } from '@/lib/actions/rasa-ibu/finance';

interface IncomeEntryModalProps {
    brandId: string;
    onClose: () => void;
}

export default function IncomeEntryModal({ brandId, onClose }: IncomeEntryModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [revenueAccountCode, setRevenueAccountCode] = useState('');
    const [description, setDescription] = useState('');
    const [assetAccountCode, setAssetAccountCode] = useState('');
    const [assetAccounts, setAssetAccounts] = useState<any[]>([]);
    const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const res = await getLedgerAccountsAction(brandId);
            if (res.success) {
                const assets = res.data.filter((a: any) => a.type === 'ASSET');
                const revenue = res.data.filter((a: any) => a.type === 'REVENUE' || a.type === 'EQUITY');

                setAssetAccounts(assets);
                setRevenueAccounts(revenue);

                if (assets.length > 0) setAssetAccountCode(assets[0].code);
                if (revenue.length > 0) setRevenueAccountCode(revenue[0].code);
            }
        }
        load();
    }, [brandId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || Number(amount) <= 0) {
            setError('Jumlah nominal harus valid');
            return;
        }

        if (!revenueAccountCode) {
            setError('Silakan pilih kategori pendapatan');
            return;
        }

        setIsLoading(true);
        try {
            const res = await recordIncomeAction({
                brandId,
                amount: Number(amount),
                revenueAccountCode,
                description: description || `Pendapatan ${revenueAccountCode}`,
                assetAccountCode,
                date: new Date()
            });

            if (res.success) {
                onClose();
            } else {
                setError(res.error || 'Gagal menyimpan pendapatan');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-xl max-h-[85vh] md:max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Catat Pemasukan</h2>
                            <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">Input Pendapatan Non-Pesanan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-3 hover:bg-emerald-50 rounded-full transition-colors group"
                    >
                        <X className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Nominal (IDR)</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <span className="text-lg font-black text-emerald-600">Rp</span>
                            </div>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="block w-full pl-16 pr-5 py-5 bg-white border-2 border-[#E5E1D8] rounded-[2rem] text-2xl font-black text-[#2D3A2D] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Revenue Category */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Kategori Pendapatan</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {revenueAccounts.map((acc: any) => (
                                <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => setRevenueAccountCode(acc.code)}
                                    className={`px-6 py-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${revenueAccountCode === acc.code
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md'
                                        : 'bg-white border-[#E5E1D8] text-[#8B7E66] hover:border-[#8B7E66]'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-tight">{acc.name}</p>
                                        <p className="text-[8px] opacity-60 font-bold">{acc.code}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${revenueAccountCode === acc.code ? 'border-emerald-500 bg-emerald-500' : 'border-[#E5E1D8]'}`}>
                                        {revenueAccountCode === acc.code && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                            {revenueAccounts.length === 0 && <p className="text-[10px] font-bold text-[#8B7E66] italic col-span-2">Belum ada akun pendapatan di CoA.</p>}
                        </div>
                    </div>

                    {/* Deposit To & Desc */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Setor Ke (Bank/Kas)</label>
                            <select
                                value={assetAccountCode}
                                onChange={(e) => setAssetAccountCode(e.target.value)}
                                className="w-full p-4 bg-white border-2 border-[#E5E1D8] rounded-2xl text-xs font-bold text-[#2D3A2D] focus:border-emerald-500 outline-none"
                            >
                                {assetAccounts.map((acc: any) => (
                                    <option key={acc.code} value={acc.code}>{acc.name} ({acc.code})</option>
                                ))}
                                {assetAccounts.length === 0 && <option value="">Belum ada akun bank/kas</option>}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Keterangan</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detail pemasukan..."
                                className="w-full p-4 bg-white border-2 border-[#E5E1D8] rounded-2xl text-xs font-bold text-[#2D3A2D] focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Simpan Pemasukan</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
