'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVarianceAnalysisAction, getAIForecastAction } from '@/lib/actions/budget';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, BrainCircuit } from 'lucide-react';

interface BudgetTrackerProps {
    brandId: string;
    fiscalYear?: number;
}

export function BudgetTracker({ brandId, fiscalYear = new Date().getFullYear() }: BudgetTrackerProps) {
    const { data: varianceData, isLoading: loadingVariance } = useQuery({
        queryKey: ['budget-variance', brandId, fiscalYear],
        queryFn: () => getVarianceAnalysisAction(brandId, fiscalYear)
    });

    const { data: forecastData, isLoading: loadingForecast } = useQuery({
        queryKey: ['budget-forecast', brandId, fiscalYear],
        queryFn: () => getAIForecastAction(brandId, fiscalYear)
    });

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    if (loadingVariance || loadingForecast) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-slate-100 rounded mb-4"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
            </div>
        );
    }

    const variance = (varianceData as any)?.data;
    const forecast = (forecastData as any)?.data;

    if (!variance) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-slate-400 font-medium">No Active Budget for {fiscalYear}</p>
                <p className="text-xs text-slate-400 mt-1">Contact Owner to set annual targets.</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'bad': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Variance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className={`p-4 rounded-xl border ${getStatusColor(variance.revenue.status)}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Revenue Target</span>
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black mb-1">{currency.format(variance.revenue.actual)}</div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs opacity-70">Target: {currency.format(variance.revenue.budget)}</span>
                        <span className="text-xs font-bold">{variance.revenue.variancePercent > 0 ? '+' : ''}{variance.revenue.variancePercent.toFixed(1)}%</span>
                    </div>
                </div>

                {/* Expense */}
                <div className={`p-4 rounded-xl border ${getStatusColor(variance.expense.status)}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Expense Limit</span>
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black mb-1">{currency.format(variance.expense.actual)}</div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs opacity-70">Limit: {currency.format(variance.expense.budget)}</span>
                        <span className="text-xs font-bold">{variance.expense.variancePercent > 0 ? '+' : ''}{variance.expense.variancePercent.toFixed(1)}%</span>
                    </div>
                </div>

                {/* AI Forecast Insight */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3" /> AI Forecast
                        </span>
                    </div>
                    {forecast?.recommendation?.shouldAdjust ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                Adjustment Recommended
                            </div>
                            <p className="text-xs leading-relaxed opacity-90 line-clamp-2">
                                {forecast.recommendation.reason}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                On Track
                            </div>
                            <p className="text-xs leading-relaxed opacity-90">
                                Performance aligns with annual targets. No aggressive changes needed.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
