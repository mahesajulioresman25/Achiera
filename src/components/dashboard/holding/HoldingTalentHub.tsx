'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Trophy,
    Zap,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Box,
    Loader2,
    Search,
    Filter,
    ChevronRight,
    Medal
} from 'lucide-react';
import { getHoldingTalentMetricsAction } from '@/lib/actions/holding';

export default function HoldingTalentHub() {
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    useEffect(() => {
        async function load() {
            const res = await getHoldingTalentMetricsAction();
            if (res.success) {
                setMetrics(res.metrics);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    const filteredMetrics = metrics.filter(m =>
        m.staffName.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-xs font-black uppercase tracking-[0.5em] text-[#8B7E66]">Analyzing Performance Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                        <span className="text-indigo-600 bg-indigo-100 p-2 rounded-2xl shadow-inner inline-flex items-center justify-center">👥</span>
                        Talent <span className="text-indigo-600">Performance Hub</span>
                    </h2>
                    <p className="text-[#8B7E66] text-sm mt-2 font-medium">Ecosystem-Wide Productivity • Commission Tracking • Leaderboards</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#E5E1D8] shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Staff..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Top Performer This Month</p>
                    <h3 className="text-3xl font-black truncate">{metrics[0]?.staffName || 'No Data'}</h3>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold">
                        <Trophy className="w-3 h-3 text-amber-300" />
                        Processed {metrics[0]?.ordersProcessed || 0} orders manually
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66] mb-2">Total Retention Reserve</p>
                    <h3 className="text-3xl font-black text-[#1A241A]">
                        {currency.format(metrics.reduce((sum, m) => sum + m.estimatedCommissions, 0))}
                    </h3>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                        <DollarSign className="w-3 h-3" />
                        Unpaid Commissions in Pipeline
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66] mb-2">Active Staff Count</p>
                    <h3 className="text-3xl font-black text-[#1A241A]">{metrics.length} <span className="text-sm font-normal text-slate-400">Collaborators</span></h3>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                        <Users className="w-3 h-3" />
                        Across {new Set(metrics.map(m => m.brandId)).size} Multi-Brand Domains
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border border-[#E5E1D8] rounded-[3rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#F9F7F2] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Medal className="w-5 h-5 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66]">Staff Performance Leaderboard</h4>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                        View Full Report
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F9F7F2]/50">
                            <tr>
                                <th className="text-left py-4 px-8 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest leading-none">Rank</th>
                                <th className="text-left py-4 px-8 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest leading-none">Staff Profile</th>
                                <th className="text-right py-4 px-8 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest leading-none">Output (Orders)</th>
                                <th className="text-right py-4 px-8 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest leading-none">Value Contribution</th>
                                <th className="text-right py-4 px-8 text-[10px] font-black text-[#8B7E66] uppercase tracking-widest leading-none">Commission</th>
                                <th className="py-4 px-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F9F7F2]">
                            {filteredMetrics.map((staff, index) => (
                                <tr key={staff.staffId} className="group hover:bg-[#F9F7F2]/30 transition-colors">
                                    <td className="py-6 px-8">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-100 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                                            #{index + 1}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black">
                                                {staff.staffName[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{staff.staffName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {staff.staffId.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right py-6 px-8">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-slate-900 text-sm">{staff.ordersProcessed}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{staff.actionsCount} Actions</span>
                                        </div>
                                    </td>
                                    <td className="text-right py-6 px-8">
                                        <span className="font-black text-slate-900 text-sm">{currency.format(staff.totalValueProcessed)}</span>
                                    </td>
                                    <td className="text-right py-6 px-8">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black">
                                            <Zap className="w-3 h-3" />
                                            {currency.format(staff.estimatedCommissions)}
                                        </div>
                                    </td>
                                    <td className="text-right py-6 px-8">
                                        <button className="p-2 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Efficiency Insight</h4>
                    <p className="text-lg font-bold leading-relaxed">
                        Your staff average <span className="text-indigo-400">{Math.round(metrics.reduce((sum, m) => sum + m.ordersProcessed, 0) / (metrics.length || 1))} orders</span> per person.
                        The top 10% of performers contribute <span className="text-emerald-400">45% of total value processed</span>. Consider rolling out the "Achiera Champion" incentive to the mid-tier.
                    </p>
                    <button className="mt-10 px-6 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors">
                        Draft Incentive Program
                    </button>
                </div>

                <div className="bg-white border border-[#E5E1D8] p-10 rounded-[3rem]">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-6">Incentive Distribution</h4>
                    <div className="space-y-6">
                        {metrics.slice(0, 4).map((staff, i) => (staff.estimatedCommissions > 0 &&
                            <div key={staff.staffId} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span className="text-slate-500">{staff.staffName}</span>
                                    <span className="text-slate-900">{Math.round((staff.estimatedCommissions / metrics.reduce((sum, m) => sum + m.estimatedCommissions, 0)) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full"
                                        style={{ width: `${(staff.estimatedCommissions / metrics.reduce((sum, m) => sum + m.estimatedCommissions, 0)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
