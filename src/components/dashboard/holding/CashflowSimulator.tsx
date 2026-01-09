'use client';

import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    ArrowRightLeft,
    Zap,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Loader2,
    DollarSign,
    ArrowRight
} from 'lucide-react';
import { runFinancialSimulationAction } from '@/lib/actions/holding';

interface CashflowSimulatorProps {
    brands: Array<{ id: string; name: string }>;
}

export default function CashflowSimulator({ brands }: CashflowSimulatorProps) {
    const [fromBrand, setFromBrand] = useState(brands[0]?.id || '');
    const [toBrand, setToBrand] = useState(brands[1]?.id || '');
    const [amount, setAmount] = useState(10000000); // Default 10M
    const [results, setResults] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    const runSimulation = async () => {
        if (fromBrand === toBrand) return;
        setIsSimulating(true);
        const res = await runFinancialSimulationAction({
            fromBrandId: fromBrand,
            toBrandId: toBrand,
            amount
        });
        if (res.success) {
            setResults(res.simulation);
        }
        setIsSimulating(false);
    };

    return (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                        CFO Capital Simulator
                    </h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Predictive Inter-Brand Allocation</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monte Carlo Linear Mode</span>
                </div>
            </div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source Brand</label>
                    <select
                        value={fromBrand}
                        onChange={(e) => setFromBrand(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div className="flex justify-center pb-3">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Brand</label>
                    <select
                        value={toBrand}
                        onChange={(e) => setToBrand(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allocation Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                    />
                </div>
            </div>

            <button
                onClick={runSimulation}
                disabled={isSimulating || fromBrand === toBrand}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
            >
                {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Run 90-Day Impact Simulation
            </button>

            {results && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-5 duration-700">
                    {/* Source Brand Impact */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Source: {brands.find(b => b.id === fromBrand)?.name}</h4>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${results.summary.isSafe ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {results.summary.isSafe ? 'Safe Solvency' : 'Risk of Insolvency'}
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={results.fromBrand}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="baseline" stroke="#94a3b8" fill="#f8fafc" strokeWidth={2} />
                                    <Area type="monotone" dataKey="simulated" stroke="#f43f5e" fill="#fff1f2" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Target Brand Impact */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Target: {brands.find(b => b.id === toBrand)?.name}</h4>
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase">
                                Liquidity Booster
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={results.toBrand}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="baseline" stroke="#94a3b8" fill="#f8fafc" strokeWidth={2} />
                                    <Area type="monotone" dataKey="simulated" stroke="#10b981" fill="#ecfdf5" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Executive Recommendation */}
                    <div className="lg:col-span-2 p-6 bg-amber-50 rounded-3xl border border-amber-100 border-dashed">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-500 text-white rounded-2xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Executive Advisor Recommendation</p>
                                <p className="text-sm font-bold text-slate-800 mt-1">
                                    {results.summary.recommended
                                        ? `The simulation indicates this transfer is safe. The source brand maintains a healthy 20% liquidity reserve. Proceed with capital allocation.`
                                        : `CAUTION: This transfer significantly depletes the source brand's operational reserves. We recommend reducing the amount by ${Math.round((amount - (results.fromBrand[0].baseline * 0.1)) / 1000000)}M to ensure solvency.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
