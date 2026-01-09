// Recent Executions Widget - Quick view of recent autonomous executions
// Shows execution status and quick actions

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';
import Link from 'next/link';

interface RecentExecutionsWidgetProps {
    brandId: string;
}

export function RecentExecutionsWidget({ brandId }: RecentExecutionsWidgetProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['executions', 'recent', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/executions/recent?brandId=${brandId}`).then(r => r.json()),
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
                <LoadingSpinner />
            </div>
        );
    }

    const executions = data?.executions || [];
    const todayCount = data?.todayCount || 0;
    const successCount = data?.successCount || 0;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅';
            case 'rolled_back': return '🔄';
            case 'failed': return '❌';
            case 'pending': return '⏳';
            default: return '•';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'rolled_back': return 'text-yellow-600';
            case 'failed': return 'text-red-600';
            case 'pending': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Recent Executions
                </h3>
                <div className="text-sm text-gray-600">
                    {todayCount} today ({successCount} success)
                </div>
            </div>

            {executions.length === 0 ? (
                <EmptyState
                    title="No recent executions"
                    description="No autonomous executions in the last 24 hours"
                />
            ) : (
                <div className="space-y-3">
                    {executions.slice(0, 5).map((execution: any) => (
                        <div key={execution.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start space-x-2">
                                    <span className="text-lg">{getStatusIcon(execution.status)}</span>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{execution.ruleName}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{execution.actionName}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium ${getStatusColor(execution.status)}`}>
                                    {execution.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-600">
                                <span>{execution.timeAgo}</span>
                                {execution.rollbackAvailable && (
                                    <span className="text-blue-600">Rollback available</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {executions.length > 5 && (
                        <div className="text-center pt-2">
                            <Link
                                href="/autonomous/executions"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View all executions →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                    href="/autonomous/executions"
                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    View All Executions
                </Link>
            </div>
        </div>
    );
}
