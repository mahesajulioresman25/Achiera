'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    generateConsolidatedStatementAction,
    getConsolidatedStatementAction,
    getAllStatementsAction
} from '@/lib/actions/financialStatements';
import { ConsolidationPeriod } from '@prisma/client';
import {
    FileText, Download, TrendingUp, DollarSign,
    Calendar, RefreshCw, CheckCircle, AlertCircle, Loader
} from 'lucide-react';

export function ConsolidatedStatementsHub() {
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
    const [period, setPeriod] = useState<ConsolidationPeriod>('ANNUAL');
    const [activeTab, setActiveTab] = useState<'pl' | 'bs' | 'cf' | 'ic'>('pl');

    const queryClient = useQueryClient();

    // Get current statement
    const { data: statementData, isLoading } = useQuery({
        queryKey: ['consolidated-statement', fiscalYear, period],
        queryFn: async () => {
            const result = await getConsolidatedStatementAction(fiscalYear, period);
            return result.data;
        }
    });

    // Get all statements
    const { data: allStatements } = useQuery({
        queryKey: ['all-statements'],
        queryFn: async () => {
            const result = await getAllStatementsAction(10);
            return result.data || [];
        }
    });

    // Generate statement mutation
    const generateMutation = useMutation({
        mutationFn: async () => {
            return await generateConsolidatedStatementAction(
                fiscalYear,
                period,
                'current-user-id' // TODO: Get from auth
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consolidated-statement'] });
            queryClient.invalidateQueries({ queryKey: ['all-statements'] });
        }
    });

    const handleGenerate = () => {
        if (confirm(`Generate consolidated statement for ${period} ${fiscalYear}?\n\nThis will replace any existing statement.`)) {
            generateMutation.mutate();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const tabs = [
        { id: 'pl' as const, label: 'Profit & Loss', icon: DollarSign },
        { id: 'bs' as const, label: 'Balance Sheet', icon: TrendingUp },
        { id: 'cf' as const, label: 'Cash Flow', icon: RefreshCw },
        { id: 'ic' as const, label: 'IC Eliminations', icon: FileText }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-md border border-blue-500/30 text-blue-400">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Consolidated Financial Statements</h2>
                                <p className="text-slate-400 font-medium">Group-wide performance analysis with automated IC elimination</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {statementData && (
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl transition-all font-bold text-sm">
                                    <Download size={18} />
                                    Export PDF
                                </button>
                            )}
                            <button
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={18} />
                                        Generate Statement
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <select
                            value={fiscalYear}
                            onChange={(e) => setFiscalYear(Number(e.target.value))}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                            {[2024, 2023, 2022, 2021].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as ConsolidationPeriod)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                        <option value="ANNUAL">Annual</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YTD">Year-to-Date</option>
                    </select>

                    {statementData && (
                        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle size={16} className="text-green-500" />
                            Generated {new Date(statementData.generatedAt).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Statement Content */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
                    <p className="text-slate-600">Loading statement...</p>
                </div>
            ) : !statementData ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Statement Available</h3>
                    <p className="text-slate-600 mb-4">
                        Generate a consolidated statement for {period} {fiscalYear}
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Generate Now
                    </button>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-200">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold transition-all ${activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6">
                            {/* P&L Tab */}
                            {activeTab === 'pl' && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900">ACHIERA HOLDING</h3>
                                        <h4 className="text-lg font-bold text-slate-700">Consolidated Statement of Profit & Loss</h4>
                                        <p className="text-sm text-slate-600">
                                            For the {period} ended {new Date(statementData.endDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Revenue</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(statementData.totalRevenue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Cost of Goods Sold</span>
                                            <span className="font-bold text-red-600">({formatCurrency(statementData.totalCOGS)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b-2 border-slate-300 bg-slate-50 px-3 rounded">
                                            <span className="font-bold text-slate-900">Gross Profit</span>
                                            <span className="font-black text-slate-900">
                                                {formatCurrency(statementData.totalRevenue - statementData.totalCOGS)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Operating Expenses</span>
                                            <span className="font-bold text-red-600">({formatCurrency(statementData.totalExpenses)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4 border-b-2 border-indigo-300 bg-indigo-50 px-3 rounded">
                                            <span className="font-black text-indigo-900 text-lg">Net Profit</span>
                                            <span className="font-black text-indigo-900 text-lg">
                                                {formatCurrency(statementData.netProfit)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-800">
                                            <strong>Note:</strong> IC Eliminations: {formatCurrency(statementData.icEliminationAmount)}
                                            ({statementData.icTransactionCount} transactions)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Balance Sheet Tab */}
                            {activeTab === 'bs' && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900">ACHIERA HOLDING</h3>
                                        <h4 className="text-lg font-bold text-slate-700">Consolidated Balance Sheet</h4>
                                        <p className="text-sm text-slate-600">
                                            As of {new Date(statementData.endDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Assets */}
                                        <div>
                                            <h5 className="font-bold text-slate-900 mb-4 text-lg border-b-2 border-slate-300 pb-2">ASSETS</h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-3 border-b-2 border-slate-300 bg-slate-50 px-3 rounded">
                                                    <span className="font-black text-slate-900">Total Assets</span>
                                                    <span className="font-black text-slate-900">
                                                        {formatCurrency(statementData.totalAssets)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Liabilities & Equity */}
                                        <div>
                                            <h5 className="font-bold text-slate-900 mb-4 text-lg border-b-2 border-slate-300 pb-2">LIABILITIES & EQUITY</h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                                    <span className="font-semibold text-slate-700">Total Liabilities</span>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCurrency(statementData.totalLiabilities)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                                    <span className="font-semibold text-slate-700">Total Equity</span>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCurrency(statementData.totalEquity)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b-2 border-indigo-300 bg-indigo-50 px-3 rounded">
                                                    <span className="font-black text-indigo-900">Total Liabilities & Equity</span>
                                                    <span className="font-black text-indigo-900">
                                                        {formatCurrency(statementData.totalLiabilities + statementData.totalEquity)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cash Flow Tab */}
                            {activeTab === 'cf' && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900">ACHIERA HOLDING</h3>
                                        <h4 className="text-lg font-bold text-slate-700">Consolidated Cash Flow Statement</h4>
                                        <p className="text-sm text-slate-600">
                                            For the {period} ended {new Date(statementData.endDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Operating Cash Flow</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(statementData.operatingCashFlow)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Investing Cash Flow</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(statementData.investingCashFlow)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="font-semibold text-slate-700">Financing Cash Flow</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(statementData.financingCashFlow)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4 border-b-2 border-indigo-300 bg-indigo-50 px-3 rounded">
                                            <span className="font-black text-indigo-900 text-lg">Net Cash Flow</span>
                                            <span className="font-black text-indigo-900 text-lg">
                                                {formatCurrency(
                                                    statementData.operatingCashFlow +
                                                    statementData.investingCashFlow +
                                                    statementData.financingCashFlow
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IC Eliminations Tab */}
                            {activeTab === 'ic' && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900">Inter-Company Eliminations</h3>
                                        <p className="text-sm text-slate-600">Transactions eliminated from consolidation</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Total Eliminated</div>
                                            <div className="text-2xl font-black text-blue-900">
                                                {formatCurrency(statementData.icEliminationAmount)}
                                            </div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                            <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Transactions</div>
                                            <div className="text-2xl font-black text-green-900">
                                                {statementData.icTransactionCount}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Impact on Revenue</div>
                                            <div className="text-2xl font-black text-purple-900">
                                                {((statementData.icEliminationAmount / statementData.totalRevenue) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    {statementData.icEliminations && Array.isArray(statementData.icEliminations) && (
                                        <div className="space-y-2">
                                            <h5 className="font-bold text-slate-900 mb-3">Elimination Details</h5>
                                            {statementData.icEliminations.map((elim: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="font-semibold text-slate-900">{elim.type}</span>
                                                            <p className="text-sm text-slate-600 mt-1">{elim.description}</p>
                                                        </div>
                                                        <span className="font-bold text-slate-900">{formatCurrency(elim.amount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Recent Statements */}
            {allStatements && allStatements.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Recent Statements</h3>
                    <div className="space-y-2">
                        {allStatements.slice(0, 5).map((stmt: any) => (
                            <button
                                key={stmt.id}
                                onClick={() => {
                                    setFiscalYear(stmt.fiscalYear);
                                    setPeriod(stmt.period);
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                            >
                                <div>
                                    <span className="font-semibold text-slate-900">
                                        {stmt.period} {stmt.fiscalYear}
                                    </span>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Generated {new Date(stmt.generatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(Number(stmt.netProfit))}</div>
                                    <div className="text-xs text-slate-500">Net Profit</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
