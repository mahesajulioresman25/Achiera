'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    generateCashFlowForecastAction,
    getForecastsAction,
    getActiveLiquidityRisksAction
} from '@/lib/actions/cashFlowForecast';
import { getAllBrandsAction } from '@/lib/actions/brands';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, TrendingDown, AlertTriangle, Zap, Calendar,
    DollarSign, Shield, Target, Loader
} from 'lucide-react';
import { toast } from 'sonner';

export function CashFlowForecastDashboard() {
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [timeframe, setTimeframe] = useState<3 | 6 | 12>(6);
    const queryClient = useQueryClient();

    // Get all brands
    const { data: brandsData } = useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const result = await getAllBrandsAction();
            const brands = result.data || [];
            // Set first brand as default if none selected
            if (brands.length > 0 && !selectedBrand) {
                setSelectedBrand(brands[0].id);
            }
            return brands;
        }
    });

    // Get forecasts
    const { data: forecastsData, isLoading: forecastsLoading, error: forecastsError } = useQuery({
        queryKey: ['cash-flow-forecasts', selectedBrand, timeframe],
        queryFn: async () => {
            if (!selectedBrand) return [];
            const result = await getForecastsAction(selectedBrand, timeframe);
            if (!result.success) {
                console.error('Forecast fetch error:', result.error);
                return [];
            }
            return result.data || [];
        },
        enabled: !!selectedBrand
    });

    // Get liquidity risks
    const { data: risksData } = useQuery({
        queryKey: ['liquidity-risks', selectedBrand],
        queryFn: async () => {
            const result = await getActiveLiquidityRisksAction(selectedBrand);
            return result.data || [];
        }
    });

    // Generate forecast mutation
    const generateMutation = useMutation({
        mutationFn: async () => {
            console.log('Generating forecast for:', selectedBrand, timeframe);
            const result = await generateCashFlowForecastAction(selectedBrand, timeframe);
            if (!result.success) {
                throw new Error(result.error || 'Failed to generate forecast');
            }
            return result;
        },
        onSuccess: (data) => {
            console.log('Forecast generated successfully:', data);
            toast.success('Prakiraan arus kas berhasil dibuat!');
            queryClient.invalidateQueries({ queryKey: ['cash-flow-forecasts'] });
            queryClient.invalidateQueries({ queryKey: ['liquidity-risks'] });
        },
        onError: (error: any) => {
            console.error('Forecast generation error:', error);
            toast.error(`Error: ${error.message}`);
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(amount);
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            month: 'short',
            year: 'numeric'
        });
    };

    const getRiskColor = (severity: string) => {
        switch (severity) {
            case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Prepare chart data
    const chartData = forecastsData?.map((f: any) => ({
        date: formatDate(f.forecastDate),
        balance: f.predictedBalance,
        bestCase: f.bestCase,
        worstCase: f.worstCase,
        mostLikely: f.mostLikely,
        confidence: f.confidence
    })) || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms]">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl p-8 text-white border border-white/5">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[60px] -ml-24 -mb-24 rounded-full" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/20 rounded-2xl backdrop-blur-md border border-cyan-500/30 text-cyan-400">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">AI Cash Flow Forecast</h2>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <Shield size={14} className="text-cyan-500" />
                                ML-powered liquidity projections for strategic planning
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending || !selectedBrand}
                        className="group flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-50"
                    >
                        {generateMutation.isPending ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap size={18} className="group-hover:scale-125 transition-transform" />
                                Generate Forecast
                            </>
                        )}
                    </button>
                </div>

                {/* Controls */}
                <div className="relative flex flex-wrap items-center gap-6 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Portfolio Brand</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border-none rounded-xl text-white font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                        >
                            {brandsData && brandsData.length > 0 ? (
                                brandsData.map((brand) => (
                                    <option key={brand.id} value={brand.id} className="text-slate-900">
                                        {brand.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" className="text-slate-900">Loading brands...</option>
                            )}
                        </select>
                    </div>

                    <div className="w-px h-8 bg-white/10 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Forecast Horizon</label>
                        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl">
                            {[3, 6, 12].map((months) => (
                                <button
                                    key={months}
                                    onClick={() => setTimeframe(months as 3 | 6 | 12)}
                                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${timeframe === months
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {months}M
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Cash Balance Forecast
                </h3>

                {forecastsLoading ? (
                    <div className="text-center py-12">
                        <Loader className="animate-spin mx-auto mb-2 text-blue-600" size={32} />
                        <p className="text-slate-600">Loading forecast data...</p>
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    style={{ fontSize: '12px', fontWeight: 600 }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    style={{ fontSize: '12px', fontWeight: 600 }}
                                    tickFormatter={(value) => formatCurrency(value)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontWeight: 600
                                    }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Legend
                                    wrapperStyle={{ fontWeight: 600, fontSize: '14px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bestCase"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#colorBest)"
                                    name="Best Case"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mostLikely"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    name="Most Likely"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="worstCase"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fill="url(#colorWorst)"
                                    name="Worst Case"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Forecast Data</h3>
                        <p className="text-slate-600 mb-4">
                            Generate a forecast to see predictions
                        </p>
                        <button
                            onClick={() => generateMutation.mutate()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                        >
                            Generate Now
                        </button>
                    </div>
                )}
            </div>

            {/* Liquidity Risks Panel */}
            {risksData && risksData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-600" />
                        Liquidity Risk Alerts
                    </h3>

                    <div className="space-y-3">
                        {risksData.map((risk: any) => (
                            <div
                                key={risk.id}
                                className={`p-4 rounded-lg border-2 ${getRiskColor(risk.severity)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(risk.severity)}`}>
                                            {risk.severity}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-700">
                                            {risk.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-600">
                                        {formatDate(risk.riskDate)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <div className="text-xs text-slate-600 mb-1">Projected Cash</div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {formatCurrency(risk.projectedCash)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-600 mb-1">Required</div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {formatCurrency(risk.requiredCash)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-600 mb-1">Shortfall</div>
                                        <div className="text-sm font-bold text-red-600">
                                            {formatCurrency(risk.shortfall)}
                                        </div>
                                    </div>
                                </div>

                                {risk.recommendations && Array.isArray(risk.recommendations) && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="text-xs font-bold text-slate-700 mb-2">Recommendations:</div>
                                        <div className="space-y-1">
                                            {risk.recommendations.slice(0, 2).map((rec: any, idx: number) => (
                                                <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                    <Target size={12} className="mt-0.5 text-blue-600 flex-shrink-0" />
                                                    <span>{rec.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Forecast Summary */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700 uppercase">Best Case</span>
                        </div>
                        <div className="text-2xl font-black text-green-900">
                            {formatCurrency(chartData[chartData.length - 1]?.bestCase || 0)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                            End of {timeframe} months
                        </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-blue-600" />
                            <span className="text-xs font-bold text-blue-700 uppercase">Most Likely</span>
                        </div>
                        <div className="text-2xl font-black text-blue-900">
                            {formatCurrency(chartData[chartData.length - 1]?.mostLikely || 0)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                            Confidence: {chartData[chartData.length - 1]?.confidence?.toFixed(0) || 0}%
                        </div>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown size={18} className="text-red-600" />
                            <span className="text-xs font-bold text-red-700 uppercase">Worst Case</span>
                        </div>
                        <div className="text-2xl font-black text-red-900">
                            {formatCurrency(chartData[chartData.length - 1]?.worstCase || 0)}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                            Risk scenario
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
