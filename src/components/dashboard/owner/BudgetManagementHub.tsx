'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllBudgetsAction, getVarianceAnalysisAction, getAIForecastAction } from '@/lib/actions/budget';
import { TrendingUp, TrendingDown, AlertCircle, Target, Lightbulb } from 'lucide-react';

export function BudgetManagementHub() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data: budgetsData, isLoading: loadingBudgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => getAllBudgetsAction()
    });

    const budgets = (budgetsData as any)?.data || [];
    const currentYearBudgets = budgets.filter((b: any) => b.fiscalYear === selectedYear);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    // Calculate totals
    const totalBudgetRevenue = currentYearBudgets.reduce((sum: number, b: any) => sum + Number(b.revenueTarget), 0);
    const totalBudgetExpense = currentYearBudgets.reduce((sum: number, b: any) => sum + Number(b.expenseTarget), 0);
    const totalBudgetProfit = currentYearBudgets.reduce((sum: number, b: any) => sum + Number(b.profitTarget), 0);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-md border border-blue-500/30 text-blue-400">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl tracking-tight">Budget Management Center</h3>
                            <p className="text-slate-400 font-medium">Track budget targets vs actual performance metrics</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                        <div className="pl-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Fiscal Year</div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2 bg-slate-800 border-none rounded-lg text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={currentYear - 1}>{currentYear - 1}</option>
                            <option value={currentYear}>{currentYear}</option>
                            <option value={currentYear + 1}>{currentYear + 1}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loadingBudgets ? (
                    <div className="text-center py-8 text-slate-400">Loading budgets...</div>
                ) : currentYearBudgets.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-amber-600" />
                        </div>
                        <h4 className="font-medium text-slate-900">No Budgets Set</h4>
                        <p className="text-sm text-slate-500 mt-1">Create budgets for {selectedYear} to start tracking performance</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Budget Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Total Revenue Target</div>
                                <div className="text-2xl font-black text-green-900">{currency.format(totalBudgetRevenue)}</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                                <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Total Expense Budget</div>
                                <div className="text-2xl font-black text-red-900">{currency.format(totalBudgetExpense)}</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                                <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Target Profit</div>
                                <div className="text-2xl font-black text-blue-900">{currency.format(totalBudgetProfit)}</div>
                            </div>
                        </div>

                        {/* Brand Budgets */}
                        <div>
                            <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Brand Budgets</h4>
                            <div className="space-y-3">
                                {currentYearBudgets.map((budget: any) => (
                                    <BudgetCard key={budget.id} budget={budget} fiscalYear={selectedYear} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BudgetCard({ budget, fiscalYear }: { budget: any; fiscalYear: number }) {
    const [showDetails, setShowDetails] = useState(false);

    const { data: varianceData } = useQuery({
        queryKey: ['variance', budget.brandId, fiscalYear],
        queryFn: () => getVarianceAnalysisAction(budget.brandId, fiscalYear),
        enabled: showDetails
    });

    const { data: forecastData } = useQuery({
        queryKey: ['forecast', budget.brandId, fiscalYear],
        queryFn: () => getAIForecastAction(budget.brandId, fiscalYear),
        enabled: showDetails
    });

    const variance = (varianceData as any)?.data;
    const forecast = (forecastData as any)?.data;
    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div
                className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h5 className="font-bold text-slate-900">{budget.brand.name}</h5>
                        <p className="text-xs text-slate-500 mt-1">FY {budget.fiscalYear} • {budget.period}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-slate-500">Revenue Target</div>
                            <div className="font-bold text-slate-900">{currency.format(Number(budget.revenueTarget))}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500">Profit Target</div>
                            <div className="font-bold text-blue-600">{currency.format(Number(budget.profitTarget))}</div>
                        </div>
                        <Target size={20} className={`text-slate-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                    </div>
                </div>
            </div>

            {showDetails && variance && (
                <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <VarianceMetric
                            label="Revenue"
                            budget={variance.revenue.budget}
                            actual={variance.revenue.actual}
                            variance={variance.revenue.variancePercent}
                            status={variance.revenue.status}
                            isRevenue={true}
                        />
                        <VarianceMetric
                            label="Expense"
                            budget={variance.expense.budget}
                            actual={variance.expense.actual}
                            variance={variance.expense.variancePercent}
                            status={variance.expense.status}
                            isRevenue={false}
                        />
                        <VarianceMetric
                            label="Profit"
                            budget={variance.profit.budget}
                            actual={variance.profit.actual}
                            variance={variance.profit.variancePercent}
                            status={variance.profit.status}
                            isRevenue={true}
                        />
                    </div>

                    {forecast && forecast.recommendation.shouldAdjust && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Lightbulb size={18} className="text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-bold text-amber-900 text-sm mb-1">AI Forecast Recommendation</div>
                                    <p className="text-xs text-amber-700">{forecast.recommendation.reason}</p>
                                    {forecast.recommendation.suggestedRevenue && (
                                        <div className="mt-2 text-xs text-amber-800">
                                            Suggested adjustment: Revenue {currency.format(forecast.recommendation.suggestedRevenue)} •
                                            Profit {currency.format(forecast.recommendation.suggestedProfit || 0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function VarianceMetric({ label, budget, actual, variance, status, isRevenue }: any) {
    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const statusColor = status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-amber-600' : 'text-red-600';
    const bgColor = status === 'good' ? 'bg-green-50' : status === 'warning' ? 'bg-amber-50' : 'bg-red-50';

    return (
        <div className={`p-3 rounded-lg ${bgColor}`}>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{label}</div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Budget:</span>
                    <span className="font-medium">{currency.format(budget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Actual:</span>
                    <span className="font-bold">{currency.format(actual)}</span>
                </div>
                <div className={`flex items-center justify-between text-xs font-bold ${statusColor}`}>
                    <span>Variance:</span>
                    <span className="flex items-center gap-1">
                        {variance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
