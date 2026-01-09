// Rules Page - Rule management and performance tracking
// Sortable table with expandable details

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';
import { RulesTable } from '@/components/autonomous/tables/RulesTable';
import { RuleDetailsPanel } from '@/components/autonomous/panels/RuleDetailsPanel';

import { useSearchParams } from 'next/navigation';

export default function RulesPage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

    // Fetch all rules
    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['rules', brandId, levelFilter, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                brandId,
                ...(levelFilter !== 'all' && { level: levelFilter.toString() }),
                ...(statusFilter !== 'all' && { status: statusFilter })
            });
            const response = await fetch(`/api/autonomous-analytics/rules?${params}`);
            return response.json();
        }
    });

    // Fetch selected rule details
    const { data: ruleDetails } = useQuery({
        queryKey: ['rule-details', selectedRuleId],
        queryFn: () => fetch(`/api/autonomous-analytics/rules/${selectedRuleId}`).then(r => r.json()),
        enabled: !!selectedRuleId
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const rules = rulesData?.rules || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Rules Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage autonomous decision rules and track performance
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Level Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Autonomy Level
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLevelFilter('all')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${levelFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    All
                                </button>
                                {[0, 1, 2, 3].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setLevelFilter(level)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${levelFilter === level
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        L{level}
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
                                {['all', 'OK', 'REVIEW', 'PAUSE'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${statusFilter === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {status === 'all' ? 'All' : status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rules Table */}
                <div className="bg-white rounded-lg shadow mb-6">
                    {rules.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="No rules found"
                                description="No rules match the selected filters"
                            />
                        </div>
                    ) : (
                        <RulesTable
                            rules={rules}
                            selectedRuleId={selectedRuleId}
                            onSelectRule={setSelectedRuleId}
                        />
                    )}
                </div>

                {/* Rule Details Panel */}
                {selectedRuleId && ruleDetails && (
                    <RuleDetailsPanel
                        rule={ruleDetails}
                        onClose={() => setSelectedRuleId(null)}
                    />
                )}
            </div>
        </div>
    );
}
