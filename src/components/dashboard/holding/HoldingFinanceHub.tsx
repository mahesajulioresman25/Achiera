'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon,
    ShieldCheck, Zap, ArrowLeft, Info, Calendar, ExternalLink, Receipt, Settings, BrainCircuit, Landmark, Building2, ChevronRight, Loader2
} from 'lucide-react';
import { getConsolidatedFinanceAction } from '@/lib/actions/holding';
import type { ConsolidatedFinancePulse } from '@/lib/intelligence/financeEngine';
import CashflowSimulator from './CashflowSimulator';

interface HoldingFinanceHubProps {
    onBack: () => void;
}

export default function HoldingFinanceHub({ onBack }: HoldingFinanceHubProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [pulse, setPulse] = useState<ConsolidatedFinancePulse | null>(null);

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    useEffect(() => {
        async function load() {
            const res = await getConsolidatedFinanceAction();
            if (res.success) {
                setPulse(res.pulse);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    // Color Palette
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];
    const GLASS_CARD = "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group";

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-[0.5em] text-[#8B7E66]">Aggregating Ecosystem Financials...</p>
            </div>
        );
    }

    if (!pulse) return null;

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20">
            {/* Header & Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Kembali ke Holding</span>
                    </button>
                    <h2 className="text-4xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                        <span className="text-amber-600 bg-amber-100 p-2 rounded-2xl shadow-inner inline-flex items-center justify-center">🏢</span>
                        Executive <span className="text-amber-600">Holding Hub</span>
                    </h2>
                    <p className="text-[#8B7E66] text-sm mt-2 font-medium">Consolidated Profit & Loss • Multi-Brand Performance</p>
                </div>

                <div className="flex items-center gap-4 bg-[#F9F7F2] p-2 rounded-2xl border border-[#E5E1D8]">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-[10px] font-bold text-[#8B7E66] flex items-center gap-2 border border-[#E5E1D8]">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Periode: All Brands • Bulan Berjalan
                    </div>
                    <button className="p-2.5 bg-white text-[#2D3A2D] border border-[#E5E1D8] rounded-xl hover:bg-[#F9F7F2] transition-all shadow-sm">
                        <Settings className="w-4 h-4" />
                    </button>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">Ecosystem Margin: {pulse.totalMonthlyRevenue > 0 ? Math.round((pulse.totalMonthlyNetProfit / pulse.totalMonthlyRevenue) * 100) : 0}%</span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#B2BCA2] mb-3 opacity-60">Total Ecosystem Net Profit</p>
                    <h3 className="text-6xl font-black tracking-tighter text-white mb-6">
                        {currency.format(pulse.totalMonthlyNetProfit)}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400/80">
                        <Zap className="w-3 h-3" />
                        Aggregated from {pulse.brandPerformance.length} brands in the portfolio
                    </div>
                </div>

                {/* Gross Revenue */}
                <div className={`${GLASS_CARD} bg-white/40 border-[#E5E1D8] text-[#1A241A]`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66] mb-4">Total Ecosystem Revenue</p>
                    <h3 className="text-3xl font-black tracking-tight">{currency.format(pulse.totalMonthlyRevenue)}</h3>
                    <div className="mt-8 flex items-center justify-between text-[10px] font-bold text-[#8B7E66]">
                        <span>Across Portfolio</span>
                        <div className="flex -space-x-2">
                            {pulse.brandPerformance.map((b, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-stone-100 text-[8px]" title={b.brandName}>
                                    {b.brandName[0]}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E1D8] mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                {/* Total COGS */}
                <div className={`${GLASS_CARD} bg-white/40 border-[#E5E1D8] text-[#1A241A]`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-4">Combined Production Cost</p>
                    <h3 className="text-3xl font-black tracking-tight">{currency.format(pulse.totalMonthlyCOGS)}</h3>
                    <p className="text-[10px] font-bold text-[#8B7E66] mt-8">
                        Cost to Revenue Ratio: <span className="text-rose-500">{pulse.totalMonthlyRevenue > 0 ? Math.round((pulse.totalMonthlyCOGS / pulse.totalMonthlyRevenue) * 100) : 0}%</span>
                    </p>
                </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white border border-[#E5E1D8] p-10 rounded-[3rem] shadow-xl">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-10">Consolidated Ecosystem Growth</h4>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={pulse.combinedRevenueTrend}>
                                <defs>
                                    <linearGradient id="colorHolding" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#8B7E66' }}
                                    tickFormatter={(val: string) => val.split('-').slice(2).join('/')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#8B7E66' }}
                                    tickFormatter={(val) => `Rp${val / 1000000}M`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    formatter={(val) => currency.format(Number(val))}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#d97706"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorHolding)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Brand Mix chart */}
                <div className="bg-white border border-[#E5E1D8] p-10 rounded-[3rem] shadow-xl">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-10">Revenue Contribution</h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pulse.brandPerformance}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="revenue"
                                    nameKey="brandName"
                                >
                                    {pulse.brandPerformance.map((entry, index) => (
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
                    <div className="mt-8 space-y-4">
                        {pulse.brandPerformance.map((brand, i) => (
                            <div key={brand.brandSlug} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-[10px] font-black uppercase text-[#1A241A]">{brand.brandName}</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600">{Math.round(brand.contribution)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CFO Capital Simulator */}
            <CashflowSimulator
                brands={pulse.brandPerformance.map(b => ({ id: b.brandSlug, name: b.brandName }))}
            />

            {/* Brand Performance Table */}
            <div className="bg-white p-10 border border-[#E5E1D8] rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66]">Brand-Level Comparative Analysis</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#F9F7F2]">
                                <th className="text-left py-4 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Brand</th>
                                <th className="text-right py-4 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Revenue</th>
                                <th className="text-right py-4 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Net Profit</th>
                                <th className="text-right py-4 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Margin</th>
                                <th className="text-right py-4 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F9F7F2]">
                            {pulse.brandPerformance.map((brand) => (
                                <tr key={brand.brandSlug} className="group hover:bg-[#F9F7F2]/50 transition-colors">
                                    <td className="py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#1A241A] flex items-center justify-center text-white font-black text-xs">
                                                {brand.brandName[0]}
                                            </div>
                                            <span className="font-black text-[#1A241A] text-sm">{brand.brandName}</span>
                                        </div>
                                    </td>
                                    <td className="text-right py-6 font-bold text-sm text-[#1A241A]">{currency.format(brand.revenue)}</td>
                                    <td className="text-right py-6 font-bold text-sm text-emerald-600">{currency.format(brand.profit)}</td>
                                    <td className="text-right py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${brand.margin > 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {Math.round(brand.margin)}% Margin
                                        </span>
                                    </td>
                                    <td className="text-right py-6">
                                        <button className="p-2 border border-[#E5E1D8] rounded-xl group-hover:bg-white group-hover:border-amber-400 group-hover:text-amber-600 transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
