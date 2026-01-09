// Budget Page - Budget consumption tracking and alerts
// Shows daily/weekly consumption and per-rule breakdown

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, ProgressBar } from '@/components/autonomous/ui/CoreComponents';

import { useSearchParams } from 'next/navigation';

export default function BudgetPage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    // Fetch daily budget
    const { data: dailyData, isLoading: loadingDaily } = useQuery({
        queryKey: ['budget', brandId, 'daily'],
        queryFn: () => fetch(`/api/autonomous-analytics/budget/consumption?brandId=${brandId}&period=daily`).then(r => r.json())
    });

    // Fetch weekly budget
    const { data: weeklyData, isLoading: loadingWeekly } = useQuery({
        queryKey: ['budget', brandId, 'weekly'],
        queryFn: () => fetch(`/api/autonomous-analytics/budget/consumption?brandId=${brandId}&period=weekly`).then(r => r.json())
    });

    // Fetch per-rule consumption
    const { data: perRuleData, isLoading: loadingPerRule } = useQuery({
        queryKey: ['budget', brandId, 'per-rule'],
        queryFn: () => fetch(`/api/autonomous-analytics/budget/per-rule?brandId=${brandId}`).then(r => r.json())
    });

    if (loadingDaily || loadingWeekly) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const daily = dailyData || {};
    const weekly = weeklyData || {};
    const perRule = perRuleData?.rules || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Budget Consumption</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Track autonomous execution budget usage
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Budget Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Daily Budget */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Budget</h2>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Financial</span>
                                <span className="text-sm font-bold text-gray-900">
                                    Rp {(daily.financial_used / 1000000).toFixed(1)}jt / Rp {(daily.financial_limit / 1000000).toFixed(1)}jt
                                </span>
                            </div>
                            <ProgressBar
                                current={daily.financial_used || 0}
                                max={daily.financial_limit || 5000000}
                                showPercentage={true}
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Executions</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {daily.executions_used} / {daily.executions_limit}
                                </span>
                            </div>
                            <ProgressBar
                                current={daily.executions_used || 0}
                                max={daily.executions_limit || 10}
                                showPercentage={true}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div>
                                <div className="text-xs text-gray-600">Remaining</div>
                                <div className="text-lg font-bold text-gray-900">
                                    Rp {(daily.financial_remaining / 1000000).toFixed(1)}jt
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600">Utilization</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {daily.utilization_percent?.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Budget */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Budget</h2>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Financial</span>
                                <span className="text-sm font-bold text-gray-900">
                                    Rp {(weekly.financial_used / 1000000).toFixed(1)}jt / Rp {(weekly.financial_limit / 1000000).toFixed(1)}jt
                                </span>
                            </div>
                            <ProgressBar
                                current={weekly.financial_used || 0}
                                max={weekly.financial_limit || 20000000}
                                showPercentage={true}
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Executions</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {weekly.executions_used} / {weekly.executions_limit}
                                </span>
                            </div>
                            <ProgressBar
                                current={weekly.executions_used || 0}
                                max={weekly.executions_limit || 50}
                                showPercentage={true}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div>
                                <div className="text-xs text-gray-600">Remaining</div>
                                <div className="text-lg font-bold text-gray-900">
                                    Rp {(weekly.financial_remaining / 1000000).toFixed(1)}jt
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600">Utilization</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {weekly.utilization_percent?.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Per-Rule Consumption */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-Rule Consumption (Daily)</h2>

                    {loadingPerRule ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Rule
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Used
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Limit
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {perRule.map((rule: any) => (
                                        <tr key={rule.ruleId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {rule.ruleName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                Rp {(rule.used / 1000).toFixed(0)}k
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                                Rp {(rule.limit / 1000).toFixed(0)}k
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <span className={`font-semibold ${rule.percentage >= 90 ? 'text-red-600' :
                                                    rule.percentage >= 70 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                    {rule.percentage.toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Budget Alerts */}
                {(daily.utilization_percent >= 70 || weekly.utilization_percent >= 70) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Budget Alerts</h3>
                        <ul className="space-y-1 text-sm text-yellow-800">
                            {daily.utilization_percent >= 90 && (
                                <li>• Daily budget 90%+ utilized - approaching limit</li>
                            )}
                            {daily.utilization_percent >= 70 && daily.utilization_percent < 90 && (
                                <li>• Daily budget 70%+ utilized</li>
                            )}
                            {weekly.utilization_percent >= 70 && (
                                <li>• Weekly budget 70%+ utilized</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
