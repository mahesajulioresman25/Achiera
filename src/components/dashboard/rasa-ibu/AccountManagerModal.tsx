'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Loader2, Check, AlertCircle } from 'lucide-react';
import { getLedgerAccountsAction, createLedgerAccountAction, initializeChartOfAccountsAction } from '@/lib/actions/rasa-ibu/finance';

interface AccountManagerModalProps {
    brandId: string;
    onClose: () => void;
}

export default function AccountManagerModal({ brandId, onClose }: AccountManagerModalProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [newAccount, setNewAccount] = useState({
        code: '',
        name: '',
        type: 'EXPENSE' as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, [brandId]);

    const loadAccounts = async () => {
        setIsLoading(true);
        const res = await getLedgerAccountsAction(brandId);
        if (res.success) {
            setAccounts(res.data);
        }
        setIsLoading(false);
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        await initializeChartOfAccountsAction(brandId);
        await loadAccounts();
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!newAccount.code || !newAccount.name) {
            setError('Kode dan Nama akun wajib diisi');
            return;
        }

        setIsCreating(true);
        try {
            const res = await createLedgerAccountAction({
                brandId,
                ...newAccount
            });

            if (res.success) {
                setSuccess(true);
                setNewAccount({ code: '', name: '', type: 'EXPENSE' });
                setShowForm(false);
                loadAccounts();
            } else {
                setError(res.error || 'Gagal membuat akun');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const accountTypes = [
        { value: 'ASSET', label: 'Aset (Asset)', color: 'text-blue-600 bg-blue-50' },
        { value: 'LIABILITY', label: 'Hutang (Liability)', color: 'text-orange-600 bg-orange-50' },
        { value: 'EQUITY', label: 'Modal (Equity)', color: 'text-purple-600 bg-purple-50' },
        { value: 'REVENUE', label: 'Pendapatan (Revenue)', color: 'text-emerald-600 bg-emerald-50' },
        { value: 'EXPENSE', label: 'Biaya (Expense)', color: 'text-rose-600 bg-rose-50' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl max-h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Manajemen Akun</h2>
                            <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">Chart of Accounts (COA)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {accounts.length === 0 && (
                            <button
                                onClick={handleInitialize}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all"
                            >
                                <Check className="w-3.5 h-3.5" /> Pakai Standar F&B
                            </button>
                        )}
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showForm ? 'bg-[#2D3A2D] text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/10 hover:bg-indigo-700'
                                }`}
                        >
                            {showForm ? 'Batal' : <><Plus className="w-3.5 h-3.5" /> Tambah Akun</>}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-100 rounded-full transition-colors group"
                        >
                            <X className="w-6 h-6 text-slate-400 group-hover:text-rose-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                    {/* Add Form */}
                    {showForm && (
                        <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-8 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6">Buat Akun Baru</h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] ml-1">Kode Akun</label>
                                    <input
                                        required
                                        placeholder="Misal: 5-9100"
                                        value={newAccount.code}
                                        onChange={e => setNewAccount({ ...newAccount, code: e.target.value })}
                                        className="w-full bg-slate-50 border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] ml-1">Nama Akun</label>
                                    <input
                                        required
                                        placeholder="Misal: Biaya Sampah"
                                        value={newAccount.name}
                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] ml-1">Tipe Akun</label>
                                    <select
                                        value={newAccount.type}
                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                                    >
                                        {accountTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Simpan Akun</>}
                                    </button>
                                </div>
                            </form>
                            {error && (
                                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-[10px] font-bold uppercase">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Account List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Daftar Akun Terdaftar</h3>
                            <span className="text-[10px] font-black text-slate-300">{accounts.length} Akun</span>
                        </div>

                        <div className="border border-[#E5E1D8] rounded-[2rem] overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9F7F2] border-b border-[#E5E1D8]">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">
                                        <th className="px-8 py-5">Kode</th>
                                        <th className="px-8 py-5">Nama Akun</th>
                                        <th className="px-8 py-5">Tipe</th>
                                        <th className="px-8 py-5 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F9F7F2]">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Memuat Akun...</p>
                                            </td>
                                        </tr>
                                    ) : accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-xs">
                                                Belum ada akun yang terdaftar.
                                            </td>
                                        </tr>
                                    ) : accounts.map(account => {
                                        const typeStyle = accountTypes.find(t => t.value === account.type)?.color || 'bg-slate-50 text-slate-600';
                                        return (
                                            <tr key={account.id} className="hover:bg-[#FDFBF7] transition-colors group">
                                                <td className="px-8 py-5 font-black text-indigo-600 text-xs">
                                                    {account.code}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black text-[#2D3A2D]">{account.name}</p>
                                                        {!account.isActive && <span className="text-[8px] font-black text-rose-500 uppercase">Nonaktif</span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${typeStyle}`}>
                                                        {account.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-[#2D3A2D] text-xs">
                                                    Rp {Number(account.balance).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-between items-center shrink-0">
                    <p className="text-[9px] font-bold text-[#8B7E66] uppercase tracking-widest leading-relaxed max-w-md">
                        * Perubahan pada Chart of Accounts akan berdampak pada laporan Buku Besar (Ledger) dan Laba/Rugi.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}
