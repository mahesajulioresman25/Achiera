// Executions Page - Execution history and rollback management
// Timeline view with filters

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';
import { ExecutionTimeline } from '@/components/autonomous/timelines/ExecutionTimeline';
import { ExecutionDetailsModal } from '@/components/autonomous/modals/ExecutionDetailsModal';

import { useSearchParams } from 'next/navigation';

export default function ExecutionsPage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('7days');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'rolled_back' | 'failed'>('all');

    // Fetch executions
    const { data, isLoading } = useQuery({
        queryKey: ['executions', brandId, dateRange, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                brandId,
                dateRange,
                ...(statusFilter !== 'all' && { status: statusFilter })
            });
            const response = await fetch(`/api/autonomous-analytics/executions?${params}`);
            return response.json();
        },
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Fetch selected execution details
    const { data: executionDetails } = useQuery({
        queryKey: ['execution-details', selectedExecutionId],
        queryFn: () => fetch(`/api/autonomous-analytics/executions/${selectedExecutionId}`).then(r => r.json()),
        enabled: !!selectedExecutionId
    });

    const executions = data?.executions || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Execution History</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        View and manage autonomous execution history
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Period
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'today', label: 'Today' },
                                    { value: '7days', label: 'Last 7 Days' },
                                    { value: '30days', label: 'Last 30 Days' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setDateRange(option.value as any)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${dateRange === option.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'success', label: 'Success' },
                                    { value: 'rolled_back', label: 'Rolled Back' },
                                    { value: 'failed', label: 'Failed' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setStatusFilter(option.value as any)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${statusFilter === option.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Execution Timeline */}
                <div className="bg-white rounded-lg shadow p-6">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : executions.length === 0 ? (
                        <EmptyState
                            title="No executions found"
                            description="No executions match the selected filters"
                        />
                    ) : (
                        <ExecutionTimeline
                            executions={executions}
                            onSelectExecution={setSelectedExecutionId}
                        />
                    )}
                </div>
            </div>

            {/* Execution Details Modal */}
            {selectedExecutionId && executionDetails && (
                <ExecutionDetailsModal
                    execution={executionDetails}
                    onClose={() => setSelectedExecutionId(null)}
                />
            )}
        </div>
    );
}
