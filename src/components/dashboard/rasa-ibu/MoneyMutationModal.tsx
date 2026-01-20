'use client';

import React from 'react';
import { X, ArrowUpRight, ArrowDownRight, Search, Calendar, Landmark as BankIcon, Receipt, TrendingUp, Filter, Download } from 'lucide-react';
import { getMoneyMutationAction } from '@/lib/actions/rasa-ibu/finance';

interface MoneyMutationModalProps {
    brandId: string;
    onClose: () => void;
}

export default function MoneyMutationModal({ brandId, onClose }: MoneyMutationModalProps) {
    const [loading, setLoading] = React.useState(true);
    const [mutations, setMutations] = React.useState<any[]>([]);
    const [filter, setFilter] = React.useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
        type: 'ALL' as 'ALL' | 'MASUK' | 'KELUAR',
        search: ''
    });

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    const loadData = React.useCallback(async () => {
        setLoading(true);
        const res = await getMoneyMutationAction(brandId, {
            startDate: filter.startDate,
            endDate: filter.endDate,
            limit: 200
        });
        if (res.success) {
            setMutations(res.data);
        }
        setLoading(false);
    }, [brandId, filter.startDate, filter.endDate]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredMutations = mutations.filter(m => {
        const matchesSearch = m.description?.toLowerCase().includes(filter.search.toLowerCase()) ||
            m.accountName?.toLowerCase().includes(filter.search.toLowerCase());
        const matchesType = filter.type === 'ALL' || m.type === filter.type;
        return matchesSearch && matchesType;
    });

    const summary = {
        totalMasuk: filteredMutations.filter(m => m.type === 'MASUK').reduce((sum, m) => sum + m.amount, 0),
        totalKeluar: filteredMutations.filter(m => m.type === 'KELUAR').reduce((sum, m) => sum + m.amount, 0),
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] rounded-[3rem] w-full max-w-5xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-[#E5E1D8] flex items-center justify-between bg-white/50">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                            <span className="bg-emerald-100 p-2 rounded-2xl shadow-inner">💸</span>
                            Histori <span className="text-emerald-600">Mutasi Kas</span>
                        </h2>
                        <p className="text-[#8B7E66] text-sm mt-1 font-medium italic">Aliran uang masuk dan keluar (Tunai & Bank)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white hover:bg-stone-50 rounded-2xl transition-all shadow-sm border border-[#E5E1D8]"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-emerald-600 rounded-[2rem] text-white shadow-xl shadow-emerald-900/10 flex flex-col justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Total Uang Masuk</p>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter">{currency.format(summary.totalMasuk)}</h3>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-emerald-100">
                                    <ArrowUpRight className="w-3 h-3" /> Penjualan & Pendapatan Lain
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-rose-600 rounded-[2rem] text-white shadow-xl shadow-rose-900/10 flex flex-col justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Total Uang Keluar</p>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter">{currency.format(summary.totalKeluar)}</h3>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-rose-100">
                                    <ArrowDownRight className="w-3 h-3" /> Biaya, Gaji & Operasional
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-[#2D3A2D] rounded-[2rem] text-white shadow-xl shadow-green-900/10 flex flex-col justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Net Cash Change</p>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter">{currency.format(summary.totalMasuk - summary.totalKeluar)}</h3>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-green-100">
                                    <TrendingUp className="w-3 h-3" /> Selisih Kas Periode Ini
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari deskripsi atau akun..."
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E5E1D8]">
                            {(['ALL', 'MASUK', 'KELUAR'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter({ ...filter, type: t })}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.type === t ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}
                                >
                                    {t === 'ALL' ? 'Semua' : t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-[#F9F7F2] px-4 py-2.5 rounded-2xl border border-[#E5E1D8]">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <input
                                    type="date"
                                    value={filter.startDate.toISOString().split('T')[0]}
                                    onChange={(e) => setFilter({ ...filter, startDate: new Date(e.target.value) })}
                                    className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                                />
                                <span className="text-[#8B7E66]">-</span>
                                <input
                                    type="date"
                                    value={filter.endDate.toISOString().split('T')[0]}
                                    onChange={(e) => setFilter({ ...filter, endDate: new Date(e.target.value) })}
                                    className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-[2.5rem] border border-[#E5E1D8] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FDFBF7] border-b border-[#E5E1D8]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Tanggal</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Deskripsi</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Akun</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] text-right">Jumlah</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E1D8]/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-xs font-black uppercase tracking-widest">Menganalisis Mutasi...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMutations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Filter className="w-12 h-12" />
                                                <p className="text-xs font-black uppercase tracking-widest">Tidak ada data ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMutations.map((m) => (
                                        <tr key={m.id} className="hover:bg-[#FDFBF7] transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-[#1A241A]">{new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[10px] text-[#8B7E66] font-medium">{new Date(m.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.type === 'MASUK' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {m.type === 'MASUK' ? <TrendingUp className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[#1A241A] leading-tight mb-1">{m.description}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                            Ref: {m.referenceType || 'MANUAL'} #{m.referenceId?.slice(-4) || 'N/A'} • {m.operator}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <BankIcon className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2 py-1 rounded-md">{m.accountCode}</span>
                                                    <span className="text-[10px] font-bold text-[#8B7E66]">{m.accountName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`text-sm font-black ${m.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {m.type === 'MASUK' ? '+' : '-'} {currency.format(m.amount).replace('Rp', '')}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${m.type === 'MASUK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {m.type}
                                                }</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-[#E5E1D8] bg-[#F9F7F2]/50 flex justify-between items-center">
                    <p className="text-[10px] text-[#8B7E66] font-bold italic">
                        Menampilkan {filteredMutations.length} transaksi terakhir
                    </p>
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-3 bg-white border border-[#E5E1D8] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] hover:bg-stone-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export / Cetak Laporan
                    </button>
                </div>
            </div>
        </div>
    );
}
