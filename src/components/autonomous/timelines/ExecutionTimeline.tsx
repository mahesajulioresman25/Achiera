// Execution Timeline - Chronological list of executions
// Shows execution cards with status and quick actions

'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Execution {
    id: string;
    ruleName: string;
    actionName: string;
    status: 'success' | 'rolled_back' | 'failed' | 'pending';
    riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedImpact: number;
    actualImpact?: number;
    executedAt: Date;
    timeAgo: string;
    rollbackAvailable: boolean;
    autoRollbackIn?: string;
}

interface ExecutionTimelineProps {
    executions: Execution[];
    onSelectExecution: (id: string) => void;
}

export function ExecutionTimeline({ executions, onSelectExecution }: ExecutionTimelineProps) {
    const queryClient = useQueryClient();

    // Rollback mutation
    const rollbackMutation = useMutation({
        mutationFn: async (executionId: string) => {
            const reason = prompt('Reason for rollback (required):');
            if (!reason || reason.length < 10) {
                throw new Error('Reason required (minimum 10 characters)');
            }

            const response = await fetch(`/api/autonomous-analytics/executions/${executionId}/rollback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    performedBy: 'current_user'
                })
            });

            if (!response.ok) throw new Error('Failed to rollback');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['executions'] });
            toast.success('Rollback berhasil dijalankan');
        },
        onError: (error: Error) => {
            if (error.message !== 'Reason required (minimum 10 characters)') {
                toast.error(`Rollback gagal: ${error.message}`);
            }
        }
    });

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
            case 'success': return 'border-green-200 bg-green-50';
            case 'rolled_back': return 'border-yellow-200 bg-yellow-50';
            case 'failed': return 'border-red-200 bg-red-50';
            case 'pending': return 'border-blue-200 bg-blue-50';
            default: return 'border-gray-200 bg-white';
        }
    };

    const getRiskColor = (tier: string) => {
        switch (tier) {
            case 'LOW': return 'text-green-600';
            case 'MEDIUM': return 'text-yellow-600';
            case 'HIGH': return 'text-orange-600';
            case 'CRITICAL': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-4">
            {executions.map((execution) => (
                <div
                    key={execution.id}
                    className={`border rounded-lg p-4 ${getStatusColor(execution.status)}`}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getStatusIcon(execution.status)}</span>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    {execution.ruleName}
                                </h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {execution.actionName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {execution.timeAgo}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-medium ${getRiskColor(execution.riskTier)}`}>
                                {execution.riskTier} Risk
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                            <div className="text-xs text-gray-600">Status</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                                {execution.status.replace('_', ' ')}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">Estimated Impact</div>
                            <div className="text-sm font-medium text-gray-900">
                                Rp {(execution.estimatedImpact / 1000).toFixed(0)}k
                            </div>
                        </div>
                        {execution.actualImpact !== undefined && (
                            <div>
                                <div className="text-xs text-gray-600">Actual Impact</div>
                                <div className="text-sm font-medium text-gray-900">
                                    Rp {(execution.actualImpact / 1000).toFixed(0)}k
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rollback Info */}
                    {execution.rollbackAvailable && (
                        <div className="mb-3 text-xs text-blue-600">
                            {execution.autoRollbackIn
                                ? `Auto-rollback in ${execution.autoRollbackIn}`
                                : 'Rollback available'
                            }
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSelectExecution(execution.id)}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            View Details
                        </button>
                        {execution.rollbackAvailable && execution.status === 'success' && (
                            <button
                                onClick={() => rollbackMutation.mutate(execution.id)}
                                disabled={rollbackMutation.isPending}
                                className="px-3 py-1.5 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 disabled:opacity-50"
                            >
                                {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback Now'}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
