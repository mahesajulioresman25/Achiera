// Execution Details Modal - Full execution trace and snapshot viewer
// Shows complete audit trail and rollback capability

'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RiskBadge } from '@/components/autonomous/ui/CoreComponents';

interface ExecutionDetailsModalProps {
    execution: {
        id: string;
        ruleName: string;
        ruleId: string;
        actionName: string;
        actionId: string;
        status: 'success' | 'rolled_back' | 'failed' | 'pending';
        riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        estimatedImpact: number;
        actualImpact?: number;
        executedAt: Date;
        rolledBackAt?: Date;
        snapshotId?: string;
        rollbackAvailable: boolean;
        auditTrail: Array<{
            timestamp: Date;
            event: string;
            details?: string;
        }>;
        snapshot?: {
            preState: any;
            postState?: any;
        };
    };
    onClose: () => void;
}

export function ExecutionDetailsModal({ execution, onClose }: ExecutionDetailsModalProps) {
    const [showSnapshot, setShowSnapshot] = useState(false);
    const queryClient = useQueryClient();

    // Rollback mutation
    const rollbackMutation = useMutation({
        mutationFn: async (reason: string) => {
            const response = await fetch(`/api/autonomous-analytics/executions/${execution.id}/rollback`, {
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
            queryClient.invalidateQueries({ queryKey: ['execution-details', execution.id] });
            toast.success('Rollback berhasil dijalankan');
            onClose();
        }
    });

    const handleRollback = () => {
        const reason = prompt('Reason for rollback (required):');
        if (!reason || reason.length < 10) {
            toast.error('Mohon berikan alasan (minimal 10 karakter)');
            return;
        }

        if (confirm(`Rollback execution: ${execution.ruleName}?`)) {
            rollbackMutation.mutate(reason);
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{execution.ruleName}</h2>
                        <p className="text-sm text-gray-500 mt-1">{execution.actionName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status & Metrics */}
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Status</div>
                            <div className={`text-lg font-bold ${getStatusColor(execution.status)}`}>
                                {execution.status.replace('_', ' ').toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Risk Tier</div>
                            <div className="mt-1">
                                <RiskBadge tier={execution.riskTier} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Estimated Impact</div>
                            <div className="text-lg font-bold text-gray-900">
                                Rp {(execution.estimatedImpact / 1000).toFixed(0)}k
                            </div>
                        </div>
                        {execution.actualImpact !== undefined && (
                            <div>
                                <div className="text-sm text-gray-600">Actual Impact</div>
                                <div className="text-lg font-bold text-gray-900">
                                    Rp {(execution.actualImpact / 1000).toFixed(0)}k
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Execution Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Execution Info</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Execution ID:</span>
                                <span className="font-mono text-gray-900">{execution.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Executed At:</span>
                                <span className="text-gray-900">{new Date(execution.executedAt).toLocaleString('id-ID')}</span>
                            </div>
                            {execution.rolledBackAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rolled Back At:</span>
                                    <span className="text-gray-900">{new Date(execution.rolledBackAt).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {execution.snapshotId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Snapshot ID:</span>
                                    <span className="font-mono text-gray-900">{execution.snapshotId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Trail</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="space-y-2">
                                {execution.auditTrail.map((entry, i) => (
                                    <div key={i} className="flex items-start space-x-3 text-sm">
                                        <span className="text-gray-500 font-mono text-xs whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleTimeString('id-ID')}
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-gray-900 font-medium">{entry.event}</div>
                                            {entry.details && (
                                                <div className="text-gray-600 text-xs mt-0.5">{entry.details}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Snapshot Viewer */}
                    {execution.snapshot && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">State Snapshot</h3>
                                <button
                                    onClick={() => setShowSnapshot(!showSnapshot)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {showSnapshot ? 'Hide' : 'Show'} Snapshot
                                </button>
                            </div>

                            {showSnapshot && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Pre-Execution State</h4>
                                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(execution.snapshot.preState, null, 2)}
                                        </pre>
                                    </div>
                                    {execution.snapshot.postState && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Post-Execution State</h4>
                                            <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                                                {JSON.stringify(execution.snapshot.postState, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {execution.rollbackAvailable && execution.status === 'success' && (
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex gap-3">
                            <button
                                onClick={handleRollback}
                                disabled={rollbackMutation.isPending}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium disabled:opacity-50"
                            >
                                {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback Execution'}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
