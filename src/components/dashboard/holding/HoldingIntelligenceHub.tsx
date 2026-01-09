'use client';

import React from 'react';
import {
    BrainCircuit,
    TrendingUp,
    Users,
    Zap,
    TrendingDown,
    AlertCircle,
    ShoppingCart,
    ArrowUpRight,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    Package
} from 'lucide-react';
import { getHoldingIntelligenceAction } from '@/lib/actions/intelligence';

export default function HoldingIntelligenceHub() {
    const [data, setData] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadIntelligence = async () => {
            setIsLoading(true);
            const res = await getHoldingIntelligenceAction();
            if (res.success) {
                setData(res);
            }
            setIsLoading(false);
        };
        loadIntelligence();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating AI Insights...</p>
            </div>
        );
    }

    const segments = data?.rfm || [];
    const forecast = data?.forecast || [];
    const restock = data?.smartRestock || [];

    const segmentStats = segments.reduce((acc: any, curr: any) => {
        acc[curr.segment] = (acc[curr.segment] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* AI Insight Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-900/20">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8" />
                        Intelligence Hub
                    </h2>
                    <p className="text-indigo-100 text-sm font-medium max-w-md">
                        Heuristic AI models are analyzing your ecosystem data to predict trends, classify customers, and optimize inventory.
                    </p>
                </div>
                <div className="hidden lg:flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Total Analyzed</p>
                        <p className="text-xl font-black">{segments.length} Customers</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Forecasting */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                            <LineChartIcon className="w-5 h-5 text-indigo-600" />
                            Revenue Forecast (Next 7 Days)
                        </h3>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">Linear Trend</span>
                    </div>

                    <div className="h-64 flex items-end gap-2 px-2">
                        {forecast.map((f: any, i: number) => {
                            const isFuture = i >= 7;
                            const maxVal = Math.max(...forecast.map((x: any) => x.actual || x.forecast));
                            const height = ((f.actual || f.forecast) / maxVal) * 100;

                            return (
                                <div key={f.date} className="flex-1 flex flex-col items-center group relative">
                                    <div
                                        style={{ height: `${height}%` }}
                                        className={`w-full rounded-t-lg transition-all ${isFuture ? 'bg-indigo-200 opacity-50 group-hover:opacity-100' : 'bg-indigo-600'}`}
                                    />
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                        Rp {(f.actual || f.forecast).toLocaleString()}
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 mt-2 rotate-45 lg:rotate-0">
                                        {f.date.split('-').slice(1).join('/')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-slate-400 italic text-center">** Dark bars represent actuals, light bars represent AI predictions based on 30-day velocity.</p>
                </div>

                {/* Customer Segmentation */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                        <PieChartIcon className="w-5 h-5 text-purple-600" />
                        RFM Segments
                    </h3>

                    <div className="space-y-4">
                        {Object.entries(segmentStats).map(([segment, count]: any) => {
                            const colors: any = {
                                CHAMPION: 'bg-emerald-500',
                                LOYAL: 'bg-blue-500',
                                AT_RISK: 'bg-rose-500',
                                NEW: 'bg-amber-500'
                            };
                            return (
                                <div key={segment} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colors[segment] || 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{segment}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{count}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase">
                                <Zap className="w-3 h-3 text-amber-500" />
                                Growth Insight
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                Your **Champions** contribute to {((segmentStats['CHAMPION'] || 0) / segments.length * 100).toFixed(1)}% of the total customer base. Target them for exclusivity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Smart Restock System */}
                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                            <Package className="w-5 h-5 text-amber-600" />
                            Smart Procurement Recommendations
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black text-rose-600 uppercase">Action Required</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item / Variant</th>
                                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Velocity</th>
                                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Remaining</th>
                                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Pred. Depletion</th>
                                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Rec. Buy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {restock.map((item: any) => (
                                    <tr key={item.variantId} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4">
                                            <p className="text-xs font-black text-slate-900">{item.name}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{item.sku}</p>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                <span className="text-xs font-bold text-slate-600">{item.velocity} <span className="text-[8px] uppercase">units/day</span></span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.stock < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                                {item.stock} Units
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <p className={`text-xs font-black ${item.daysRemaining < 7 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                {item.daysRemaining <= 0 ? 'Out of Stock' : `${item.daysRemaining} Days`}
                                            </p>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                                Order {item.recommendation}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {restock.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold">No critical stock depletion predicted based on current velocity.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
