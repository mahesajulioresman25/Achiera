'use client';

import React from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon,
    ShieldCheck, Zap, ArrowLeft, Info, Calendar, ExternalLink, Receipt, Settings, BrainCircuit, Landmark, BookOpen, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Box
} from 'lucide-react';

import type { FinancialPulse } from '@/lib/intelligence/financeEngine';
import TaxReportModal from './TaxReportModal';
import SettlementParserModal from './finance/SettlementParserModal';
import { ICTracker } from '../ICTracker';
import { BudgetTracker } from '../BudgetTracker';
import { getPriceAnalysisAction, getStockAction, getBrandPriceAnalysisAction } from '@/lib/actions/rasa-ibu/stock';
import { History, Search, ArrowRight, FileText } from 'lucide-react';
import LedgerModal from './LedgerModal';

interface FinanceHubProps {
    brandId: string;
    pulse: FinancialPulse;
    onBack: () => void;
    onOpenExpenseEntry: () => void;
    onOpenIncomeEntry: () => void;
    onOpenIntel: () => void;
    onOpenAccountManager: () => void;
    onOpenAssetHub: () => void;
    onOpenSettings: () => void;
    onOpenPricing: () => void;
}


export default function FinanceHub({ brandId, pulse, onBack, onOpenExpenseEntry, onOpenIncomeEntry, onOpenIntel, onOpenAccountManager, onOpenAssetHub, onOpenSettings, onOpenPricing }: FinanceHubProps) {
    const [showTaxReport, setShowTaxReport] = React.useState(false);
    const [showSettlementParser, setShowSettlementParser] = React.useState(false);
    const [showLedger, setShowLedger] = React.useState(false);

    // Price Intelligence State
    const [materials, setMaterials] = React.useState<any[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = React.useState<string | 'OVERVIEW'>('OVERVIEW');
    const [priceAnalysis, setPriceAnalysis] = React.useState<any[]>([]);
    const [overviewData, setOverviewData] = React.useState<any>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = React.useState(false);
    const [trendGranularity, setTrendGranularity] = React.useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');


    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    const formatSafeCurrency = (val: any) => {
        if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return 'Rp 0';
        return currency.format(val);
    };

    React.useEffect(() => {
        const loadMaterials = async () => {
            const res = await getStockAction(brandId);
            if (res.success) setMaterials(res.data);
        };
        loadMaterials();
    }, [brandId]);

    React.useEffect(() => {
        const loadAnalysis = async () => {
            setIsLoadingAnalysis(true);
            if (selectedMaterialId === 'OVERVIEW') {
                const res = await getBrandPriceAnalysisAction(brandId);
                if (res.success && res.data) {
                    setOverviewData(res.data);
                    setPriceAnalysis(res.data.aggregateTrend);
                }
            } else if (selectedMaterialId) {
                const res = await getPriceAnalysisAction(selectedMaterialId);
                if (res.success) setPriceAnalysis(res.data || []);
            }
            setIsLoadingAnalysis(false);
        };
        loadAnalysis();
    }, [selectedMaterialId, brandId]);

    // Color Palette
    const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
    const GLASS_CARD = "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group";

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20">
            {/* Header & Control */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Kembali ke OPS</span>
                    </button>
                    <h2 className="text-2xl md:text-4xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                        <span className="text-emerald-600 bg-emerald-100 p-2 rounded-2xl shadow-inner inline-flex items-center justify-center">📈</span>
                        Intelligence <span className="text-emerald-600">Finance Hub</span>
                    </h2>
                    <p className="text-[#8B7E66] text-xs md:text-sm mt-2 font-medium">Laporan Laba/Rugi & Analisis Margin Strategis</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-[#F9F7F2] p-2 md:p-3 rounded-2xl border border-[#E5E1D8]">
                    <button
                        onClick={() => setShowTaxReport(true)}
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-white text-[#2D3A2D] border border-rose-200 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Landmark className="w-3.5 h-3.5 text-rose-500" />
                        Laporan Pajak
                    </button>
                    <button
                        onClick={() => setShowSettlementParser(true)}
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-indigo-600 text-white border border-indigo-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        <BrainCircuit className="w-3.5 h-3.5" />
                        Settlement AI
                    </button>
                    <button
                        onClick={onOpenIncomeEntry}
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Pemasukan
                    </button>
                    <button
                        onClick={onOpenPricing}
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-white text-[#2D3A2D] border border-emerald-200 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        Strategi Harga
                    </button>
                    <button
                        onClick={onOpenExpenseEntry}
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-rose-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2"
                    >
                        <Receipt className="w-3.5 h-3.5" />
                        Biaya
                    </button>
                    <div className="px-3 md:px-4 py-2 bg-white rounded-xl shadow-sm text-[9px] md:text-[10px] font-bold text-[#8B7E66] flex items-center gap-2 border border-[#E5E1D8]">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Bulan Ini
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenIntel}
                            className="p-2 md:p-2.5 bg-indigo-600 text-white border border-indigo-500 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10"
                            title="AI Business Intelligence"
                        >
                            <BrainCircuit className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                        <button
                            onClick={onOpenAccountManager}
                            className="p-2 md:p-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
                            title="Chart of Accounts"
                        >
                            <BookOpen className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowLedger(true)}
                            className="p-2 md:p-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
                            title="Buku Besar (Jurnal)"
                        >
                            <FileText className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                        <button
                            onClick={onOpenAssetHub}
                            className="p-2 md:p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all shadow-sm"
                            title="Manajemen Aset"
                        >
                            <Box className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="p-2 md:p-2.5 bg-white text-[#2D3A2D] border border-[#E5E1D8] rounded-xl hover:bg-[#F9F7F2] transition-all shadow-sm"
                        >
                            <Settings className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Stat Cards (Glassmorphism Dark) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Net Profit Card */}
                <div className={`${GLASS_CARD} bg-gradient-to-br from-[#1A241A] to-[#0A0F0A] col-span-1 md:col-span-2 ring-1 ring-emerald-500/30`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="flex justify-between items-start mb-10">
                        <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">Net Margin: {pulse.monthlyRevenue > 0 ? Math.round((pulse.monthlyNetProfit / pulse.monthlyRevenue) * 100) : 0}%</span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#B2BCA2] mb-3 opacity-60">Estimasi Laba Bersih</p>
                    <h3 className="text-6xl font-black tracking-tighter text-white mb-6">
                        {currency.format(pulse.monthlyNetProfit)}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400/80">
                        <Zap className="w-3 h-3" />
                        Data dihitung setelah potongan HPP & Komisi Marketplace
                    </div>
                </div>

                {/* Gross Revenue with Periodic Info */}
                <div className={`${GLASS_CARD} bg-white/40 border-[#E5E1D8] text-[#1A241A] flex flex-col justify-between`}>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Penjualan Berkala</p>
                            {pulse.growth.revenue > 0 ? (
                                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {Math.round(pulse.growth.revenue)}% Growth
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                                    <ArrowDownRight className="w-3 h-3" />
                                    {Math.round(Math.abs(pulse.growth.revenue))}% Drop
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 mt-2">
                            <div className="flex justify-between items-end border-b border-dashed border-[#E5E1D8] pb-2">
                                <span className="text-[10px] font-bold text-[#8B7E66]">Harian:</span>
                                <span className="text-sm font-black">{currency.format(pulse.periodicSales.daily)}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-dashed border-[#E5E1D8] pb-2">
                                <span className="text-[10px] font-bold text-[#8B7E66]">Mingguan:</span>
                                <span className="text-sm font-black">{currency.format(pulse.periodicSales.weekly)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-[#8B7E66]">Tahunan:</span>
                                <span className="text-sm font-black text-emerald-600 font-black">{currency.format(pulse.periodicSales.yearly)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[8px] font-black text-[#8B7E66] uppercase tracking-widest">Revenue Target: {currency.format(pulse.targets.revenue)}</div>
                            <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{Math.min(Math.round(pulse.targets.revenueProgress), 100)}% Achieved</div>
                        </div>
                        <div className="h-1.5 w-full bg-[#E5E1D8] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(pulse.targets.revenueProgress, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* HPP & Expired Burden with Targeting */}
                <div className={`${GLASS_CARD} bg-white/20 border-[#E5E1D8] text-[#1A241A] flex flex-col justify-between`}>
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Biaya & Efisiensi</p>
                        <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${pulse.targets.expenseProgress > 100 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {pulse.targets.expenseProgress > 100 ? 'Over Budget' : 'Safe Budget'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-[#8B7E66]">HPP: {currency.format(pulse.monthlyCOGS)}</span>
                            <span className="text-rose-600">Ops: {currency.format(pulse.monthlyLedgerExpenses)}</span>
                        </div>
                        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Beban Expired
                                </p>
                                <h4 className="text-xl font-black text-rose-700">{currency.format(pulse.expiredBurden)}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Limit: {currency.format(pulse.targets.expenseLimit)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E5E1D8]/50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${pulse.targets.expenseProgress > 90 ? 'bg-rose-500' : 'bg-[#1A241A]'}`} style={{ width: `${Math.min(pulse.targets.expenseProgress, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset & ROI Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Assets Card */}
                <div className={`${GLASS_CARD} bg-gradient-to-br from-emerald-600 to-teal-700 text-white`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-4 bg-white/20 rounded-2xl border border-white/20">
                            <Box className="w-6 h-6 text-white" />
                        </div>
                        <button
                            onClick={onOpenAssetHub}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/20"
                        >
                            Kelola Aset <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-100 mb-3 opacity-80 relative z-10">Total Aset Bisnis</p>
                    <h3 className="text-5xl font-black tracking-tighter text-white mb-4 relative z-10">
                        {currency.format(pulse.profitability?.totalAssets || 0)}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-100/80 relative z-10">
                        <Target className="w-3 h-3" />
                        Terdaftar dalam Inventori Aset
                    </div>
                </div>

                {/* ROI Card */}
                <div className={`${GLASS_CARD} bg-gradient-to-br from-indigo-600 to-purple-700 text-white`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-4 bg-white/20 rounded-2xl border border-white/20">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 bg-white/20 px-4 py-2 rounded-full border border-white/20">
                            {(pulse.profitability?.roi || 0) >= 0 ? 'Positive' : 'Negative'}
                        </span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-100 mb-3 opacity-80 relative z-10">ROI (Return on Investment)</p>
                    <h3 className="text-5xl font-black tracking-tighter text-white mb-4 relative z-10">
                        {(pulse.profitability?.roi || 0).toFixed(2)}%
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-100/80 relative z-10">
                        <Info className="w-3 h-3" />
                        Efisiensi Pemanfaatan Aset Bulanan
                    </div>
                </div>
            </div>


            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-[#E5E1D8] p-10 rounded-[3rem] shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-1">Revenue Trend & AI Prediction</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualisasi Performa Berjangka</p>
                        </div>
                        <div className="flex items-center gap-4 bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E5E1D8]">
                            {['Daily', 'Weekly', 'Monthly'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTrendGranularity(type as any)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${trendGranularity === type
                                        ? 'bg-[#2D3A2D] text-white shadow-lg'
                                        : 'text-[#8B7E66] hover:bg-white hover:text-[#2D3A2D]'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...pulse.revenueTrend, ...pulse.forecastTrend]}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#8B7E66' }}
                                    tickFormatter={(val: string) => {
                                        if (trendGranularity === 'Monthly') return val.split('-').slice(0, 2).join('/');
                                        return val.split('-').slice(2).join('/');
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#8B7E66' }}
                                    tickFormatter={(val) => `Rp${val / 1000000}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '1.5rem',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        padding: '1.5rem'
                                    }}
                                    formatter={(val) => currency.format(Number(val))}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 4 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Marketplace Distribution */}
                <div className="bg-white border border-[#E5E1D8] p-10 rounded-[3rem] shadow-xl flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-10">Marketplace Effective Margin</h4>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pulse.channelBreakdown}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="grossAmount"
                                    >
                                        {pulse.channelBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                                        formatter={(val) => currency.format(Number(val))}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 space-y-5">
                            {pulse.channelBreakdown.map((item, idx) => (
                                <div key={item.channel} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-[10px] font-black uppercase text-[#1A241A] tracking-wider">{item.channel}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black">{currency.format(item.netAmount)}</p>
                                        <p className="text-[8px] font-bold text-emerald-600">Margin: {item.grossAmount > 0 ? Math.round((item.netAmount / item.grossAmount) * 100) : 0}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 italic text-[10px] text-emerald-800 font-medium">
                        "Marketplace WA memiliki margin tertinggi karena minim biaya platform."
                    </div>
                </div>
            </div>

            {/* Efficiency & Profit Leakage Audit (Radar) */}
            <div className="bg-white border border-[#E5E1D8] p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-2">Efficiency & Leakage Radar</h4>
                        <p className="text-sm text-[#2D3A2D] font-medium italic">Audit otomatis untuk mendeteksi biaya tersembunyi & kebocoran profit.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[#F9F7F2] px-6 py-3 rounded-2xl border border-[#E5E1D8]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Financial Health Score</span>
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${pulse.efficiency?.efficiencyScore || 0}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-black text-emerald-600">{Math.round(pulse.efficiency?.efficiencyScore || 0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Marketplace Commission */}
                    <div className="space-y-4">
                        <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E1D8] flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <PieIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Tagihan Jasa Aplikasi</span>
                        </div>
                        <div className="px-2">
                            <h5 className="text-2xl font-black text-[#2D3A2D]">{currency.format(pulse.efficiency?.totalCommission || 0)}</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Estimasi potongan komisi dari semua platform.</p>
                        </div>
                    </div>

                    {/* MDR / Admin Fees */}
                    <div className="space-y-4">
                        <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E1D8] flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">MDR & Biaya Transaksi</span>
                        </div>
                        <div className="px-2">
                            <h5 className="text-2xl font-black text-[#2D3A2D]">{currency.format(pulse.efficiency?.totalMDR || 0)}</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Biaya admin pembayaran & pencairan dana.</p>
                        </div>
                    </div>

                    {/* Waste / Expired */}
                    <div className="space-y-4">
                        <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E1D8] flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Kebocoran Inventori</span>
                        </div>
                        <div className="px-2">
                            <h5 className="text-2xl font-black text-[#2D3A2D]">{currency.format(pulse.efficiency?.totalWaste || 0)}</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Nilai produk yang expired / dibuang bulan ini.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-1000">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Info className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h6 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">Strategi Optimasi Profit</h6>
                        <p className="text-[11px] font-medium text-emerald-800/80 leading-relaxed">
                            {(pulse.efficiency?.totalMDR || 0) > (pulse.efficiency?.totalCommission || 0) * 0.2 ?
                                "Biaya MDR Bunda tergolong tinggi dibanding komisi. Pertimbangkan untuk membatasi metode pembayaran mahal atau naikkan sedikit harga di platform terkait." :
                                "Struktur biaya platform sudah efisien. Fokuslah pada menekan 'Kebocoran Inventori' agar margin laba bersih bisa lebih tebal."
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Target Advisor Section */}
            <div className="grid grid-cols-1 gap-8">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-white/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                            <BrainCircuit className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-1 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="w-4 h-4 text-emerald-200" />
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-100">AI Target Advisor</h4>
                            </div>
                            <h3 className="text-2xl font-black mb-4">Rekomendasi Strategis Bulan Ini</h3>
                            <p className="text-sm text-emerald-50 font-medium leading-relaxed max-w-2xl">
                                {pulse.targets.revenueProgress < 50 ? (
                                    "Omzet baru mencapai " + Math.round(pulse.targets.revenueProgress) + "% dari target AI. Disarankan untuk memicu kampanye #BDS atau promo WhatsApp untuk mengejar target tengah bulan."
                                ) : pulse.targets.expenseProgress > 90 ? (
                                    "Perhatian! Pengeluaran Anda sudah mendekati limit (" + Math.round(pulse.targets.expenseProgress) + "%). Tekan biaya operasional non-essential untuk menjaga margin laba bersih."
                                ) : (
                                    "Performa stabil. Kapasitas pengeluaran masih sisa " + currency.format(pulse.targets.expenseLimit - (pulse.monthlyCOGS + pulse.monthlyLedgerExpenses)) + ". Anda bisa mempertimbangkan untuk investasi di iklan marketplace untuk skalabilitas."
                                )}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/10 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-2">Safety Margin</p>
                            <h4 className="text-3xl font-black">{Math.round(100 - pulse.targets.expenseProgress)}%</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Insight Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cash Flow Forecast */}
                <div className="bg-gradient-to-br from-white to-[#F9F7F2] border border-[#E5E1D8] p-10 rounded-[3rem] shadow-sm flex items-center gap-8">
                    <div className="w-32 h-32 flex-shrink-0 bg-[#2D3A2D] rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Cash Runway</p>
                        <h4 className="text-3xl font-black tracking-tighter">42</h4>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1">Hari</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1A241A]">Financial Resilience</h4>
                        </div>
                        <p className="text-xs text-[#8B7E66] font-medium leading-relaxed">
                            Berdasarkan biaya operasional (5-xxxx) dan proyeksi omzet, kas Anda dalam kondisi aman untuk 6 minggu ke depan tanpa modal tambahan.
                        </p>
                    </div>
                </div>

                {/* Tax Readiness */}
                <div className="bg-white border border-[#E5E1D8] p-10 rounded-[3rem] shadow-sm flex items-center gap-8 group">
                    <div className="w-32 h-32 flex-shrink-0 border-4 border-[#F9F7F2] rounded-full relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 bg-amber-500/20" style={{ height: '11%' }}></div>
                        <h4 className="text-2xl font-black text-[#1A241A] relative z-10">11<span className="text-sm">%</span></h4>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-amber-600" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1A241A]">Tax Obligations (PPN)</h4>
                        </div>
                        <p className="text-xs text-[#8B7E66] font-medium leading-relaxed">
                            Total estimasi PPN 11% yang harus disisihkan bulan ini: <span className="text-[#1A241A] font-bold">{currency.format(pulse.monthlyRevenue * 0.11)}</span>. Pastikan saldo Kas Bank mencukupi.
                        </p>
                    </div>
                </div>
            </div>

            {/* Raw Material Price Intelligence */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#1A241A] flex items-center gap-2">
                    <span className="bg-amber-500 text-white p-1.5 rounded-lg"><History size={16} /></span>
                    Raw Material Price Intelligence
                </h3>
                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[3rem] shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={selectedMaterialId || ''}
                                onChange={(e) => setSelectedMaterialId(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            >
                                <option value="OVERVIEW">📊 Analisis Keseluruhan (Overview)</option>
                                <optgroup label="Bahan Spesifik">
                                    {materials.map((mat) => (
                                        <option key={mat.id} value={mat.id}>
                                            {mat.product.name} {mat.name !== 'Default' ? `- ${mat.name}` : ''} ({mat.product.inventoryType === 'RAW_MATERIAL' ? 'Bahan' : 'Kemasan'})
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {selectedMaterialId === 'OVERVIEW' && overviewData && (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="px-6 py-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-1">Total Bahan</p>
                                    <p className="text-xl font-black text-[#1A241A]">{materials.length}</p>
                                </div>
                                <div className="px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 col-span-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" /> Top Volatility (Bahan Paling Berfluktuasi)
                                    </p>
                                    <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                                        {overviewData.topMovers.map((m: any, idx: number) => (
                                            <div key={idx} className="flex-shrink-0">
                                                <p className="text-[9px] font-bold text-[#2D3A2D] truncate w-32">{m.name}</p>
                                                <p className={`text-xs font-black ${m.change > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {m.change > 0 ? '+' : ''}{m.change.toFixed(1)}%
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedMaterialId !== 'OVERVIEW' && selectedMaterialId && priceAnalysis.length > 0 && (
                            <div className="flex gap-4">
                                <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Harga Terbaru</p>
                                    <p className="text-lg font-black text-emerald-900">
                                        {formatSafeCurrency(priceAnalysis[priceAnalysis.length - 1]?.price)}
                                    </p>
                                </div>
                                <div className="px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Rentang Harga</p>
                                    <p className="text-lg font-black text-amber-900">
                                        {formatSafeCurrency(Math.min(...priceAnalysis.map(p => p?.price || 0).filter(p => p > 0)))} - {formatSafeCurrency(Math.max(...priceAnalysis.map(p => p?.price || 0)))}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedMaterialId ? (
                        isLoadingAnalysis ? (
                            <div className="h-[400px] w-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                            </div>
                        ) : priceAnalysis.length > 0 ? (
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={priceAnalysis}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={selectedMaterialId === 'OVERVIEW' ? '#10b981' : '#f59e0b'} stopOpacity={0.1} />
                                                <stop offset="95%" stopColor={selectedMaterialId === 'OVERVIEW' ? '#10b981' : '#f59e0b'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                            tickFormatter={(val) => `Rp${(val || 0).toLocaleString()}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '1rem',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '1rem',
                                                fontSize: '11px',
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(val: any) => [
                                                formatSafeCurrency(val),
                                                selectedMaterialId === 'OVERVIEW' ? 'Harga Rata-rata Index' : 'Harga Beli'
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedMaterialId === 'OVERVIEW' ? 'avgPrice' : 'price'}
                                            stroke={selectedMaterialId === 'OVERVIEW' ? '#10b981' : '#f59e0b'}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[400px] w-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <History className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Belum ada riwayat harga untuk bahan ini</p>
                            </div>
                        )
                    ) : (
                        <div className="h-[400px] w-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <TrendingUp className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-40">Pilih bahan baku di atas untuk melihat tren harga</p>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW: Holding Integration Section (IC & Budget) */}
            <div>
                <h3 className="text-xl font-bold text-[#1A241A] mb-6 flex items-center gap-2">
                    <span className="bg-[#2D3A2D] text-white p-1.5 rounded-lg"><TrendingUp size={16} /></span>
                    Holding Compliance & Tracking
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                        <h4 className="text-sm font-bold text-[#8B7E66] uppercase tracking-wider mb-6">Budget Performance</h4>
                        <BudgetTracker brandId={brandId} />
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                        <h4 className="text-sm font-bold text-[#8B7E66] uppercase tracking-wider mb-6">Inter-Company Transactions</h4>
                        <ICTracker brandId={brandId} brandName="Rasa Ibu" />
                    </div>
                </div>
            </div>

            {showTaxReport && <TaxReportModal brandId={brandId} onClose={() => setShowTaxReport(false)} />}
            {showSettlementParser && <SettlementParserModal brandId={brandId} onClose={() => setShowSettlementParser(false)} />}
            {showLedger && <LedgerModal brandId={brandId} onClose={() => setShowLedger(false)} />}
        </div>
    );
}
