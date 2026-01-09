'use client';

import React, { useEffect, useState } from 'react';
import { getFinancialReportsAction, getAccountDetailsAction } from '@/lib/actions/rasa-ibu/finance';
import { FileText, X, TrendingUp, Scale, Printer, Calendar, PieChart as PieIcon, ChevronRight, GripHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface FinancialReportsModalProps {
    brandId: string;
    onClose: () => void;
}

export default function FinancialReportsModal({ brandId, onClose }: FinancialReportsModalProps) {
    const [activeTab, setActiveTab] = useState<'PL' | 'BS' | 'CF' | 'EQ' | 'NOTES'>('PL');
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Date Range (Defaults to current month)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Drill Down State
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [accountDetails, setAccountDetails] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
    const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

    const loadData = async () => {
        setIsLoading(true);
        setData(null);
        // Convert string dates back to Date objects for API
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        // Adjust end date to cover the full day
        end.setHours(23, 59, 59, 999);

        const res = await getFinancialReportsAction(brandId, activeTab, start, end);
        if (res.success) {
            setData(res.data);
        }
        setIsLoading(false);
    };

    const handleAccountClick = async (accountCode: string, accountName: string) => {
        setSelectedAccount({ code: accountCode, name: accountName });
        setIsLoadingDetails(true);

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);

        const res = await getAccountDetailsAction(brandId, accountCode, start, end);
        if (res.success) {
            setAccountDetails(res.data);
        }
        setIsLoadingDetails(false);
    };

    useEffect(() => {
        loadData();
    }, [activeTab, brandId, dateRange]);

    const handlePrint = () => {
        window.print();
    };

    // Helper to calculate common-size %
    const getPercentage = (amount: number, base: number) => {
        if (!base || base === 0) return 0;
        return ((Math.abs(amount) / base) * 100).toFixed(1);
    };

    // Prepare Pie Data
    const preparePieData = (items: any[]) => {
        if (!items) return [];
        // Sort by amount desc
        const sorted = [...items].sort((a, b) => b.amount - a.amount);
        // Take top 5
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((sum, item) => sum + item.amount, 0);

        const result = top5.map(item => ({ name: item.name, value: item.amount }));
        if (others > 0) {
            result.push({ name: 'Lainnya', value: others });
        }
        return result;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500 relative print:shadow-none print:max-h-none print:overflow-visible print:rounded-none">

                {/* Header */}
                <div className="px-10 py-6 border-b border-[#E5E1D8] bg-white flex justify-between items-center shrink-0 print:hidden">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-50 rounded-2xl">
                            <FileText className="w-8 h-8 text-[#8B7E66]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Laporan Keuangan</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">Executive Reports</h2>
                        </div>
                    </div>

                    {/* Date Picker Control */}
                    <div className="flex items-center gap-3 bg-[#F9F7F2] p-2 rounded-2xl border border-[#E5E1D8]">
                        <Calendar className="w-4 h-4 text-[#8B7E66] ml-2" />
                        <input
                            type="date"
                            className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-[#8B7E66]">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handlePrint} className="p-3 hover:bg-slate-100 rounded-full transition-colors group" title="Print Report">
                            <Printer className="w-6 h-6 text-slate-400 group-hover:text-[#2D3A2D]" />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#E5E1D8] bg-[#F9F7F2] shrink-0 overflow-x-auto no-scrollbar print:hidden">
                    {[
                        { id: 'PL', label: 'Laba & Rugi', icon: TrendingUp },
                        { id: 'BS', label: 'Neraca', icon: Scale },
                        { id: 'CF', label: 'Arus Kas', icon: GripHorizontal },
                        { id: 'EQ', label: 'Ekuitas', icon: PieIcon },
                        { id: 'NOTES', label: 'CaLK', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[120px] py-4 flex items-center justify-center gap-2 border-b-4 transition-colors ${activeTab === tab.id ? 'border-[#8B7E66] bg-white' : 'border-transparent hover:bg-white/50'}`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#8B7E66]' : 'text-slate-400'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-[#2D3A2D]' : 'text-slate-400'}`}>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 bg-white relative print:p-0 print:overflow-visible">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-amber-200 border-t-[#8B7E66] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menghitung Angka...</p>
                        </div>
                    ) : (data && (
                        <div className="max-w-5xl mx-auto space-y-12">

                            {/* REPORT VIEWS */}
                            {activeTab === 'PL' && data?.revenue && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-10">
                                        {/* Revenue */}
                                        <section className="space-y-4">
                                            <h3 className="text-lg font-black text-[#2D3A2D] border-b pb-2 flex justify-between items-end">
                                                <span>Pendapatan</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Common Size %</span>
                                            </h3>
                                            <div className="space-y-2">
                                                {data.revenue?.items?.map((item: any) => (
                                                    <div key={item.code} onClick={() => handleAccountClick(item.code, item.name)} className="flex justify-between items-center p-3 rounded-xl hover:bg-[#F9F7F2] cursor-pointer group">
                                                        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#8B7E66]" />
                                                            {item.name}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                            <span className="w-12 text-right text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">100%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center pt-3 border-t border-dashed px-3">
                                                    <span className="font-black text-[#2D3A2D] uppercase tracking-widest text-[10px]">Total Pendapatan</span>
                                                    <span className="font-black text-emerald-600 text-lg">{currency.format(data.revenue?.total || 0)}</span>
                                                </div>
                                            </div>
                                        </section>

                                        {/* COGS & Gross Profit */}
                                        <section className="space-y-4">
                                            <h3 className="text-lg font-black text-rose-600 border-b pb-2">Harga Pokok Penjualan</h3>
                                            <div className="space-y-2">
                                                {data.cogs?.items?.map((item: any) => (
                                                    <div key={item.code} onClick={() => handleAccountClick(item.code, item.name)} className="flex justify-between items-center p-3 rounded-xl hover:bg-rose-50 cursor-pointer group">
                                                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                            <span className="w-12 text-right text-[10px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded">{getPercentage(item.amount, data.revenue?.total)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="bg-[#2D3A2D] text-white p-6 rounded-[2rem] flex justify-between items-center shadow-lg mt-4">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest opacity-60 font-black">Laba Kotor</p>
                                                        <p className="text-2xl font-black">{currency.format(data.grossProfit || 0)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-widest opacity-60 font-black">Gross Margin</p>
                                                        <p className="text-xl font-bold text-emerald-400">{getPercentage(data.grossProfit || 0, data.revenue?.total)}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Operational Expenses */}
                                        <section className="space-y-4">
                                            <h3 className="text-lg font-black text-[#2D3A2D] border-b pb-2">Beban Operasional</h3>
                                            <div className="space-y-2">
                                                {data.expenses?.items?.map((item: any) => (
                                                    <div key={item.code} onClick={() => handleAccountClick(item.code, item.name)} className="flex justify-between items-center p-3 rounded-xl hover:bg-[#F9F7F2] cursor-pointer group">
                                                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                            <span className="w-12 text-right text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{getPercentage(item.amount, data.revenue?.total)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center pt-3 border-t border-dashed px-3">
                                                    <span className="font-black text-[#2D3A2D] uppercase tracking-widest text-[10px]">Total Beban Operasional</span>
                                                    <span className="font-black text-rose-500 text-lg">{currency.format(data.expenses?.total || 0)}</span>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Taxes & Net Profit */}
                                        <section className="mt-10 pt-10 border-t-4 border-[#2D3A2D] space-y-4">
                                            <div className="flex justify-between items-center text-slate-600">
                                                <span className="text-sm font-bold uppercase tracking-widest">Laba Bersih Sebelum Pajak</span>
                                                <span className="text-lg font-black">{currency.format(data.netIncomeBeforeTax || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-500">
                                                <span className="text-sm font-bold uppercase tracking-widest">Estimasi PPh Final (UMKM)</span>
                                                <span className="text-lg font-black">- {currency.format(data.taxAmount || 0)}</span>
                                            </div>
                                            <div className="bg-[#8B7E66] text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-xl">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.3em] font-black mb-1">LABA BERSIH AKHIR (Net Profit)</p>
                                                    <p className="text-4xl font-black">{currency.format(data.netProfit || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs uppercase tracking-[0.3em] font-black mb-1 opacity-60">NETT MARGIN</p>
                                                    <p className="text-2xl font-black text-emerald-300">{(data.margin || 0).toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Sidebar: Summary & Charts */}
                                    <div className="space-y-8">
                                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#E5E1D8] shadow-lg">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-center mb-6">Struktur Biaya</h4>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={preparePieData(data.expenses?.items)} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                                            {preparePieData(data.expenses?.items).map((entry: any, index: any) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip formatter={(val: any) => currency.format(val)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {data.pulse && (
                                            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-4">
                                                <p className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]">
                                                    <TrendingUp className="w-3 h-3" /> Business Insight
                                                </p>
                                                <p className="text-xs leading-relaxed text-slate-300">
                                                    {data.margin > 20 ? "Performa bisnis sangat sehat dengan margin di atas rata-rata industri kuliner. Pertahankan efisiensi biaya bahan baku." :
                                                        data.margin > 5 ? "Bisnis berjalan stabil. Monitor biaya operasional agar tidak menggerus laba bersih di bulan-bulan sepi." :
                                                            "Margin laba kritis. Segera evaluasi harga jual atau tekan biaya operasional segera."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'BS' && data?.assets && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    {/* ASSETS */}
                                    <section className="space-y-6">
                                        <div className="flex justify-between items-end border-b-2 border-[#2D3A2D] pb-3">
                                            <h3 className="text-2xl font-black text-[#2D3A2D]">ASET (KEKAYAAN)</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Debit Balance</span>
                                        </div>
                                        <div className="space-y-4">
                                            {data.assets?.items?.map((item: any) => (
                                                <div key={item.code} className="flex justify-between items-center group">
                                                    <span className="text-sm font-bold text-slate-700">{item.name} <span className="text-[10px] text-slate-300">({item.code})</span></span>
                                                    <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="pt-6 border-t border-double border-[#E5E1D8] flex justify-between items-center">
                                                <span className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">TOTAL ASET</span>
                                                <span className="text-2xl font-black text-[#2D3A2D]">{currency.format(data.assets?.total || 0)}</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* LIABILITIES & EQUITY */}
                                    <section className="space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b-2 border-[#2D3A2D] pb-3">
                                                <h3 className="text-2xl font-black text-[#2D3A2D]">KEWAJIBAN & MODAL</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Balance</span>
                                            </div>

                                            {/* Liabilities */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full inline-block">Liabilitas (Utang)</p>
                                                {data.liabilities?.items?.map((item: any) => (
                                                    <div key={item.code} className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                                        <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                    </div>
                                                ))}
                                                <div className="text-right pt-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Subtotal: {currency.format(data.liabilities?.total || 0)}</span>
                                                </div>
                                            </div>

                                            {/* Equity */}
                                            <div className="space-y-4 pt-6">
                                                <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full inline-block">Ekuitas (Modal)</p>
                                                {data.equity?.items?.map((item: any) => (
                                                    <div key={item.code} className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                                        <span className="text-sm font-black text-[#2D3A2D]">{currency.format(item.amount)}</span>
                                                    </div>
                                                ))}
                                                <div className="text-right pt-2 border-b border-[#E5E1D8] pb-4">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Subtotal: {currency.format(data.equity?.total || 0)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">TOTAL KEWAJIBAN & MODAL</span>
                                                <span className="text-2xl font-black text-[#2D3A2D]">{currency.format((data.liabilities?.total || 0) + (data.equity?.total || 0))}</span>
                                            </div>
                                        </div>

                                        {/* Balanced Check Indicator */}
                                        <div className={`p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all ${data?.isBalanced ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200 animate-pulse'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data?.isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                    <Scale className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#2D3A2D]">{data?.isBalanced ? 'STATUS: SEIMBANG (BALANCED)' : 'STATUS: TIDAK SEIMBANG'}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aset = Liabilitas + Ekuitas</p>
                                                </div>
                                            </div>
                                            {!data?.isBalanced && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-rose-600 uppercase">Selisih:</p>
                                                    <p className="text-sm font-black text-rose-600">{currency.format(data?.difference || 0)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'CF' && data?.operating && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {[
                                            { key: 'operating', label: 'Aktivitas Operasi', desc: 'Arus kas dari penjualan & biaya operasional', color: 'emerald' },
                                            { key: 'investing', label: 'Aktivitas Investasi', desc: 'Arus kas dari pembelian aset tetap', color: 'blue' },
                                            { key: 'financing', label: 'Aktivitas Pendanaan', desc: 'Arus kas dari modal & pinjaman', color: 'purple' }
                                        ].map(section => (
                                            <div key={section.key} className={`bg-[#F9F7F2] p-8 rounded-[2.5rem] border border-[#E5E1D8] relative overflow-hidden group`}>
                                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-${section.color}-500/5 rounded-full`} />
                                                <h3 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest mb-1">{section.label}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold mb-6">{section.desc}</p>

                                                <div className="space-y-3 mb-8 min-h-[120px]">
                                                    {data[section.key]?.items?.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center text-xs">
                                                            <span className="font-bold text-slate-600 truncate mr-4">{item.name}</span>
                                                            <span className={`font-black ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{item.amount > 0 ? '+' : ''}{currency.format(item.amount)}</span>
                                                        </div>
                                                    ))}
                                                    {(!data[section.key]?.items || data[section.key]?.items.length === 0) && <p className="text-[10px] text-slate-300 italic py-4">Tidak ada pergerakan kas</p>}
                                                </div>

                                                <div className="pt-4 border-t border-[#E5E1D8] flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase text-[#8B7E66]">Net {section.label}</span>
                                                    <span className={`text-lg font-black ${(data[section.key]?.total || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {currency.format(data[section.key]?.total || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-[#2D3A2D] text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10">
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Saldo Awal Kas</p>
                                            <p className="text-2xl font-black">{currency.format(data.openingBalance || 0)}</p>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-16 h-1 bg-white/20 rounded-full mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-60">KENAIKAN/PENURUNAN BERSIH</p>
                                            <p className={`text-4xl font-black ${(data.netChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {(data.netChange || 0) > 0 ? '+' : ''}{currency.format(data.netChange || 0)}
                                            </p>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Saldo Akhir Kas</p>
                                            <p className="text-4xl font-black text-emerald-400">{currency.format(data.closingBalance || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'EQ' && data?.initialBalance !== undefined && (
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-3xl font-black text-[#2D3A2D]">Laporan Perubahan Ekuitas</h3>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Periode: {data.period ? new Date(data.period.start).toLocaleDateString() : '-'} - {data.period ? new Date(data.period.end).toLocaleDateString() : '-'}</p>
                                    </div>

                                    <div className="bg-white border-2 border-[#E5E1D8] rounded-[2.5rem] divide-y-2 divide-[#F9F7F2] overflow-hidden shadow-sm">
                                        <div className="p-8 flex justify-between items-center group">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-[#2D3A2D]">Modal Awal</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Saldo Awal Periode</p>
                                            </div>
                                            <span className="text-xl font-black text-[#2D3A2D]">{currency.format(data.initialBalance || 0)}</span>
                                        </div>

                                        <div className="p-8 space-y-6 bg-[#F9F7F2]/30">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Laba Bersih Periode Ini (+)</span>
                                                <span className="text-lg font-black text-emerald-600">+{currency.format(data.netIncome || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Tambahan Setoran Modal (+)</span>
                                                <span className="text-lg font-black text-emerald-600">+{currency.format(data.injections || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-rose-500 uppercase tracking-widest">Pengambilan Prive (-)</span>
                                                <span className="text-lg font-black text-rose-500">-{currency.format(data.withdrawals || 0)}</span>
                                            </div>
                                        </div>

                                        <div className="p-10 bg-[#2D3A2D] text-white flex justify-between items-center">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black uppercase tracking-[0.3em] opacity-60">MODAL AKHIR</p>
                                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">{data.period ? new Date(data.period.end).toLocaleDateString() : '-'}</p>
                                            </div>
                                            <span className="text-4xl font-black text-emerald-400">{currency.format(data.closingBalance || 0)}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                        <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                                        <p className="text-xs text-[#8B7E66] leading-relaxed">
                                            <b>Informasi:</b> Laporan ini menunjukkan mutasi modal pemilik. Laba bersih menambah modal, sementara prive (penarikan pribadi) mengurangi hak modal dalam bisnis.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'NOTES' && data?.notes && (
                                <div className="max-w-4xl mx-auto space-y-12">
                                    <div className="text-center space-y-4">
                                        <div className="inline-block p-4 bg-slate-900 rounded-full mb-2">
                                            <FileText className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black text-[#2D3A2D]">Catatan Atas Laporan Keuangan</h3>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em]">Notes to Financial Statements</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {data.notes?.map((note: any, idx: number) => (
                                            <div key={idx} className="space-y-4 p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:shadow-lg transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 flex items-center justify-center bg-[#8B7E66] text-white text-[10px] font-black rounded-full">{idx + 1}</span>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">{note.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                                    {note.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-10 border-t border-dashed text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">Tanda Tangan Pengesahan</p>
                                        <div className="mt-16 inline-block border-b-2 border-slate-200 w-64" />
                                        <p className="mt-2 text-[10px] font-black uppercase text-[#2D3A2D]">Achiera AI Financial Intelligence</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* DRILL DOWN MODAL (OVERLAY) */}
                {selectedAccount && (
                    <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="px-10 py-6 border-b border-[#E5E1D8] flex justify-between items-center bg-white">
                            <div>
                                <button onClick={() => setSelectedAccount(null)} className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] transition-colors mb-1 text-[10px] uppercase font-black tracking-widest">
                                    <ChevronRight className="w-3 h-3 rotate-180" /> Kembali
                                </button>
                                <h3 className="text-2xl font-black text-[#2D3A2D]">{selectedAccount.name}</h3>
                                <p className="text-xs text-slate-400 font-bold">{selectedAccount.code}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest text-[#8B7E66]">Total Periode Ini</p>
                                <p className="text-xl font-black text-emerald-600">
                                    {accountDetails.length > 0 ?
                                        currency.format(accountDetails.reduce((sum, item) => sum + Number(item.debit || 0) - Number(item.credit || 0), 0))
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            {isLoadingDetails ? (
                                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-dashed border-[#E5E1D8] text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">
                                            <th className="pb-4">Tanggal</th>
                                            <th className="pb-4">Deskripsi Transaksi</th>
                                            <th className="pb-4 text-right">Debit</th>
                                            <th className="pb-4 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F9F7F2]">
                                        {accountDetails.map((detail) => (
                                            <tr key={detail.id} className="group hover:bg-[#F9F7F2]">
                                                <td className="py-4 text-xs font-bold text-slate-400">
                                                    {new Date(detail.transaction.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-xs font-bold text-[#2D3A2D]">{detail.transaction.description}</p>
                                                </td>
                                                <td className="py-4 text-right text-xs font-bold text-emerald-600">
                                                    {Number(detail.debit) > 0 ? currency.format(Number(detail.debit)) : '-'}
                                                </td>
                                                <td className="py-4 text-right text-xs font-bold text-rose-500">
                                                    {Number(detail.credit) > 0 ? currency.format(Number(detail.credit)) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
