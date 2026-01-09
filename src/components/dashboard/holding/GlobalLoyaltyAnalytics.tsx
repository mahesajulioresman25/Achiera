'use client';

import React from 'react';
import { getGlobalLoyaltyStatsAction } from '@/lib/actions/holding';
import {
    Users,
    Coins,
    TrendingUp,
    ArrowRightLeft,
    Loader2,
    ChevronRight,
    Trophy,
    Target
} from 'lucide-react';
import { format } from 'date-fns';

export default function GlobalLoyaltyAnalytics() {
    const [data, setData] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadStats() {
            setIsLoading(true);
            const res = await getGlobalLoyaltyStatsAction();
            if (res.success) {
                setData(res.stats);
            }
            setIsLoading(false);
        }
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-indigo-500" />
                        Loyalty Ecosystem
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Cross-brand point monitoring & redemption hub.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Unified Economy Active</span>
                </div>
            </div>

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Members</p>
                            <p className="text-2xl font-black text-slate-900">{data.totalMembers.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Coins className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Available Points</p>
                            <p className="text-2xl font-black text-slate-900">{data.totalPointsAcrossHolding.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Redemption Value</p>
                            <p className="text-2xl font-black text-slate-900">Rp {(data.totalPointsAcrossHolding * 1000).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brand Breakdown */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                            Brand Performance
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {data.brandStats.map((brand: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                        {brand.brandName.substring(0, 1)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{brand.brandName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{brand.memberCount} Members</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900">{brand.pointsAvailable.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Points Avail.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Global Redemptions */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                            Recent Cross-Redemptions
                        </h3>
                    </div>

                    {data.recentRedemptions.length > 0 ? (
                        <div className="space-y-6">
                            {data.recentRedemptions.map((redemption: any) => (
                                <div key={redemption.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Customer: {redemption.customerName}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                In {redemption.brandName} • {format(new Date(redemption.date), 'dd MMM, HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-red-500 text-sm">-{redemption.points}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
                            <ArrowRightLeft className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">No cross-redemptions recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Sparkles({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
