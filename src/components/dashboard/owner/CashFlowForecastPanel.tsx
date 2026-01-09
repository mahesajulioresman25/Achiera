'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCashFlowForecastAction } from '@/lib/actions/cashFlow';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar } from 'lucide-react';

interface CashFlowForecastPanelProps {
    brandId: string;
}

export function CashFlowForecastPanel({ brandId }: CashFlowForecastPanelProps) {
    const [forecastPeriod, setForecastPeriod] = useState<30 | 60 | 90>(30);

    const { data: forecastData, isLoading } = useQuery({
        queryKey: ['cashflow-forecast', brandId, forecastPeriod],
        queryFn: () => getCashFlowForecastAction(brandId, forecastPeriod)
    });

    const forecast = (forecastData as any)?.data;
    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="text-center text-slate-400">Loading cash flow forecast...</div>
            </div>
        );
    }

    if (!forecast) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="text-center text-slate-400">No forecast data available</div>
            </div>
        );
    }

    const criticalAlerts = forecast.alerts.filter((a: any) => a.severity === 'CRITICAL');
    const mediumAlerts = forecast.alerts.filter((a: any) => a.severity === 'MEDIUM');

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-lg text-cyan-900">Cash Flow Forecast</h3>
                        <p className="text-sm text-cyan-700 mt-1">Projected liquidity for next {forecastPeriod} days</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setForecastPeriod(30)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${forecastPeriod === 30
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50'
                                }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setForecastPeriod(60)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${forecastPeriod === 60
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50'
                                }`}
                        >
                            60 Days
                        </button>
                        <button
                            onClick={() => setForecastPeriod(90)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${forecastPeriod === 90
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50'
                                }`}
                        >
                            90 Days
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Current Cash</div>
                        <div className="text-2xl font-black text-blue-900">{currency.format(forecast.currentCashBalance)}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Projected Inflows</div>
                        <div className="text-2xl font-black text-green-900 flex items-center justify-center gap-1">
                            <TrendingUp size={20} />
                            {currency.format(forecast.summary.totalProjectedInflows)}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Projected Outflows</div>
                        <div className="text-2xl font-black text-red-900 flex items-center justify-center gap-1">
                            <TrendingDown size={20} />
                            {currency.format(forecast.summary.totalProjectedOutflows)}
                        </div>
                    </div>
                    <div className={`text-center p-4 rounded-xl border-2 ${forecast.summary.endingBalance > forecast.safetyThreshold
                            ? 'bg-emerald-50 border-emerald-300'
                            : forecast.summary.endingBalance > forecast.criticalThreshold
                                ? 'bg-amber-50 border-amber-300'
                                : 'bg-rose-50 border-rose-300'
                        }`}>
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${forecast.summary.endingBalance > forecast.safetyThreshold
                                ? 'text-emerald-700'
                                : forecast.summary.endingBalance > forecast.criticalThreshold
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                            }`}>
                            Ending Balance
                        </div>
                        <div className={`text-2xl font-black ${forecast.summary.endingBalance > forecast.safetyThreshold
                                ? 'text-emerald-900'
                                : forecast.summary.endingBalance > forecast.criticalThreshold
                                    ? 'text-amber-900'
                                    : 'text-rose-900'
                            }`}>
                            {currency.format(forecast.summary.endingBalance)}
                        </div>
                    </div>
                </div>

                {/* Liquidity Alerts */}
                {(criticalAlerts.length > 0 || mediumAlerts.length > 0) && (
                    <div className="mb-6">
                        <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-600" />
                            Liquidity Alerts
                        </h4>
                        <div className="space-y-2">
                            {criticalAlerts.map((alert: any, idx: number) => (
                                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={18} className="text-red-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="font-bold text-red-900 text-sm">{alert.message}</div>
                                            <div className="text-xs text-red-700 mt-1">{alert.recommendation}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {mediumAlerts.map((alert: any, idx: number) => (
                                <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="font-bold text-amber-900 text-sm">{alert.message}</div>
                                            <div className="text-xs text-amber-700 mt-1">{alert.recommendation}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Simple Chart Visualization */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Cash Balance Trend</h4>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="space-y-2">
                            {forecast.projections.filter((_: any, idx: number) => idx % Math.ceil(forecast.projections.length / 10) === 0).map((projection: any, idx: number) => {
                                const maxBalance = Math.max(...forecast.projections.map((p: any) => p.cumulativeBalance));
                                const widthPercent = (projection.cumulativeBalance / maxBalance) * 100;

                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="text-xs text-slate-500 w-20">
                                            Day {Math.ceil((new Date(projection.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                        <div className="flex-1 bg-slate-200 rounded-full h-6 relative overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${projection.alertLevel === 'GREEN'
                                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                                        : projection.alertLevel === 'AMBER'
                                                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                            : 'bg-gradient-to-r from-red-400 to-rose-500'
                                                    }`}
                                                style={{ width: `${widthPercent}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center px-3">
                                                <span className="text-xs font-bold text-white drop-shadow">
                                                    {currency.format(projection.cumulativeBalance)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t border-slate-300 flex items-center justify-center gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-green-400 to-emerald-500" />
                                <span className="text-slate-600">Healthy ({currency.format(forecast.safetyThreshold)}+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-400 to-orange-500" />
                                <span className="text-slate-600">Caution</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-red-400 to-rose-500" />
                                <span className="text-slate-600">Critical ({currency.format(forecast.criticalThreshold)}-)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
