'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    generateAllocationRecommendationsAction,
    getCashPositionsAction,
    getAllAllocationsAction,
    approveAllocationAction
} from '@/lib/actions/capitalAllocation';
import {
    DollarSign, TrendingUp, TrendingDown, AlertTriangle,
    RefreshCw, CheckCircle, XCircle, Loader, ArrowRight,
    Target, Shield, Zap
} from 'lucide-react';

export function CapitalAllocationDashboard() {
    const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Get cash positions
    const { data: cashData, isLoading: cashLoading } = useQuery({
        queryKey: ['cash-positions'],
        queryFn: async () => {
            const result = await getCashPositionsAction();
            return result.data || null;
        }
    });

    // Get latest allocation recommendations
    const { data: allocationsData, isLoading: allocationsLoading } = useQuery({
        queryKey: ['allocations'],
        queryFn: async () => {
            const result = await getAllAllocationsAction(5);
            return result.data || [];
        }
    });

    // Generate new recommendations
    const generateMutation = useMutation({
        mutationFn: async () => {
            return await generateAllocationRecommendationsAction('current-user-id');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocations'] });
            queryClient.invalidateQueries({ queryKey: ['cash-positions'] });
        }
    });

    // Approve allocation
    const approveMutation = useMutation({
        mutationFn: async (allocationId: string) => {
            return await approveAllocationAction(allocationId, 'current-user-id');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocations'] });
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const latestAllocation = allocationsData?.[0];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms]">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl p-8 text-white border border-white/5">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-[60px] -ml-24 -mb-24 rounded-full" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-500/30 text-indigo-400">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Capital Allocation Optimizer</h2>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <Shield size={14} className="text-indigo-500" />
                                AI-powered capital deployment strategies and ROI projections
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                        className="group flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-50"
                    >
                        {generateMutation.isPending ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Zap size={18} className="group-hover:scale-125 transition-transform" />
                                Optimize Allocation
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* Summary Stats */}
            {cashData && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                        <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Total Cash</div>
                        <div className="text-2xl font-black">{formatCurrency(cashData.totalCash)}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                        <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Avg Runway</div>
                        <div className="text-2xl font-black">{cashData.averageRunway.toFixed(1)} months</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                        <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Critical Brands</div>
                        <div className="text-2xl font-black text-red-300">{cashData.criticalBrands.length}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                        <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Excess Cash</div>
                        <div className="text-2xl font-black text-green-300">{cashData.excessCashBrands.length}</div>
                    </div>
                </div>
            )}

            {/* Cash Positions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-indigo-600" />
                    Cash Positions by Brand
                </h3>

                {cashLoading ? (
                    <div className="text-center py-8">
                        <Loader className="animate-spin mx-auto mb-2 text-indigo-600" size={32} />
                        <p className="text-slate-600">Loading cash positions...</p>
                    </div>
                ) : cashData ? (
                    <div className="grid grid-cols-3 gap-4">
                        {cashData.positions.map((position: any) => (
                            <div
                                key={position.brandId}
                                className={`p-4 rounded-lg border-2 ${position.runway < 3
                                    ? 'bg-red-50 border-red-200'
                                    : position.runway > 12
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-900">{position.brandName}</h4>
                                    {position.trend === 'INCREASING' ? (
                                        <TrendingUp size={18} className="text-green-600" />
                                    ) : position.trend === 'DECREASING' ? (
                                        <TrendingDown size={18} className="text-red-600" />
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Cash:</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(position.cash)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Runway:</span>
                                        <span className={`font-bold ${position.runway < 3 ? 'text-red-600' :
                                            position.runway > 12 ? 'text-green-600' : 'text-slate-900'
                                            }`}>
                                            {position.runway.toFixed(1)} months
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Burn Rate:</span>
                                        <span className="font-semibold text-slate-700">{formatCurrency(position.burnRate)}/mo</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* AI Recommendations */}
            {
                latestAllocation && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Target size={20} className="text-indigo-600" />
                                AI Recommendations
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-slate-600">Overall Score</div>
                                    <div className="text-2xl font-black text-indigo-600">{latestAllocation.overallScore.toFixed(0)}/100</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full border font-bold text-sm ${getRiskColor(latestAllocation.riskLevel)}`}>
                                    <Shield size={14} className="inline mr-1" />
                                    {latestAllocation.riskLevel} RISK
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {Array.isArray(latestAllocation.recommendations) && latestAllocation.recommendations.map((rec: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                                                    {rec.type.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(rec.risk)}`}>
                                                    {rec.risk} RISK
                                                </span>
                                                <span className="text-xs text-slate-500">Priority: {rec.priority}/10</span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                {rec.fromBrand && (
                                                    <>
                                                        <span className="font-semibold text-slate-700">{rec.fromBrand}</span>
                                                        <ArrowRight size={16} className="text-slate-400" />
                                                    </>
                                                )}
                                                <span className="font-semibold text-slate-900">{rec.toBrand || 'Reserve'}</span>
                                                <span className="font-black text-indigo-600">{formatCurrency(rec.amount)}</span>
                                            </div>

                                            <p className="text-sm text-slate-600 mb-2">{rec.reason}</p>

                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp size={14} className="text-green-600" />
                                                    <span className="text-slate-600">Predicted ROI:</span>
                                                    <span className="font-bold text-green-600">{rec.predictedROI}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => approveMutation.mutate(latestAllocation.id)}
                                disabled={approveMutation.isPending || latestAllocation.status !== 'PENDING'}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold disabled:opacity-50"
                            >
                                <CheckCircle size={18} />
                                {latestAllocation.status === 'APPROVED' ? 'Approved' : 'Approve & Execute'}
                            </button>
                            <button
                                disabled={latestAllocation.status !== 'PENDING'}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-bold disabled:opacity-50"
                            >
                                <XCircle size={18} />
                                Reject
                            </button>
                            <div className="ml-auto text-sm text-slate-600">
                                <div>Generated: {new Date(latestAllocation.generatedAt).toLocaleString()}</div>
                                <div>Confidence: {latestAllocation.confidence.toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Empty State */}
            {
                !latestAllocation && !allocationsLoading && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Recommendations Yet</h3>
                        <p className="text-slate-600 mb-4">
                            Generate AI-powered capital allocation recommendations based on current cash positions
                        </p>
                        <button
                            onClick={() => generateMutation.mutate()}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold"
                        >
                            Generate Now
                        </button>
                    </div>
                )
            }
        </div>
    );
}
