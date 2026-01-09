'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConsolidatedKPIsAction } from '@/lib/actions/kpi';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity } from 'lucide-react';

export function StrategicKPIDashboard() {
    const { data: kpiData, isLoading } = useQuery({
        queryKey: ['consolidated-kpis'],
        queryFn: () => getConsolidatedKPIsAction()
    });

    const kpis = (kpiData as any)?.data;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="text-center text-slate-400">Loading KPI dashboard...</div>
            </div>
        );
    }

    if (!kpis) {
        return null;
    }

    const getStatusColor = (value: number, target: number, higherIsBetter: boolean = true) => {
        const diff = higherIsBetter ? value - target : target - value;
        const percentDiff = (diff / target) * 100;

        if (percentDiff >= 0) return 'text-green-600 bg-green-50 border-green-200';
        if (percentDiff >= -10) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-500/30 text-indigo-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl tracking-tight">Strategic KPI Dashboard</h3>
                        <p className="text-slate-400 font-medium">Core performance indicators across {kpis.totalBrands} portfolio brands</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Revenue KPIs */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign size={18} className="text-green-600" />
                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Revenue Performance</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <KPICard
                            label="Monthly Growth"
                            value={`${kpis.avgMonthlyGrowthRate.toFixed(1)}%`}
                            target={10}
                            actual={kpis.avgMonthlyGrowthRate}
                            icon={kpis.avgMonthlyGrowthRate >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            higherIsBetter={true}
                        />
                        <KPICard
                            label="Gross Margin"
                            value={`${kpis.avgGrossProfitMargin.toFixed(1)}%`}
                            target={40}
                            actual={kpis.avgGrossProfitMargin}
                            icon={<DollarSign size={20} />}
                            higherIsBetter={true}
                        />
                        <KPICard
                            label="Net Margin"
                            value={`${kpis.avgNetProfitMargin.toFixed(1)}%`}
                            target={15}
                            actual={kpis.avgNetProfitMargin}
                            icon={<Activity size={20} />}
                            higherIsBetter={true}
                        />
                    </div>
                </div>

                {/* Customer KPIs */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-blue-600" />
                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Customer Metrics</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <KPICard
                            label="LTV:CAC Ratio"
                            value={`${kpis.avgLtvToCacRatio.toFixed(1)}x`}
                            target={3.0}
                            actual={kpis.avgLtvToCacRatio}
                            icon={<Users size={20} />}
                            higherIsBetter={true}
                            description="Target: >3.0 (healthy)"
                        />
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Retention Rate</div>
                            <div className="text-2xl font-black text-slate-900">75%</div>
                            <div className="text-xs text-slate-500 mt-1">Industry avg: 70%</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Churn Rate</div>
                            <div className="text-2xl font-black text-slate-900">25%</div>
                            <div className="text-xs text-slate-500 mt-1">Target: &lt;20%</div>
                        </div>
                    </div>
                </div>

                {/* Financial Health KPIs */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Package size={18} className="text-purple-600" />
                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Financial Health</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <KPICard
                            label="Current Ratio"
                            value={kpis.avgCurrentRatio.toFixed(2)}
                            target={1.5}
                            actual={kpis.avgCurrentRatio}
                            icon={<Activity size={20} />}
                            higherIsBetter={true}
                            description="Target: >1.5 (healthy liquidity)"
                        />
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Ratio</div>
                            <div className="text-2xl font-black text-slate-900">1.2</div>
                            <div className="text-xs text-slate-500 mt-1">Target: &gt;1.0</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Debt-to-Equity</div>
                            <div className="text-2xl font-black text-slate-900">0.8</div>
                            <div className="text-xs text-slate-500 mt-1">Target: &lt;2.0</div>
                        </div>
                    </div>
                </div>

                {/* Brand Performance Breakdown */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Brand Performance</h4>
                    <div className="space-y-2">
                        {kpis.brandKPIs?.slice(0, 5).map((brandKPI: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{brandKPI.brandName}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Growth: {brandKPI.revenue.monthlyGrowthRate.toFixed(1)}% •
                                        Margin: {brandKPI.profitability.netProfitMargin.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${brandKPI.revenue.monthlyGrowthRate >= 10 ? 'bg-green-100 text-green-700' :
                                        brandKPI.revenue.monthlyGrowthRate >= 0 ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {brandKPI.revenue.monthlyGrowthRate >= 10 ? '🟢 Excellent' :
                                            brandKPI.revenue.monthlyGrowthRate >= 0 ? '🟡 Good' :
                                                '🔴 Needs Attention'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, target, actual, icon, higherIsBetter = true, description }: any) {
    const diff = higherIsBetter ? actual - target : target - actual;
    const percentDiff = target !== 0 ? (diff / target) * 100 : 0;

    let statusColor = 'bg-green-50 border-green-200';
    let textColor = 'text-green-700';
    let status = '🟢';

    if (percentDiff < 0) {
        if (percentDiff >= -10) {
            statusColor = 'bg-amber-50 border-amber-200';
            textColor = 'text-amber-700';
            status = '🟡';
        } else {
            statusColor = 'bg-red-50 border-red-200';
            textColor = 'text-red-700';
            status = '🔴';
        }
    }

    return (
        <div className={`p-4 rounded-lg border ${statusColor}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                <div className={textColor}>{icon}</div>
            </div>
            <div className={`text-2xl font-black ${textColor}`}>{value}</div>
            <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-slate-500">
                    {description || `Target: ${target}${typeof value === 'string' && value.includes('%') ? '%' : ''}`}
                </div>
                <div className="text-lg">{status}</div>
            </div>
        </div>
    );
}
