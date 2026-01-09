// Approval Modal - Detailed approval view with CFO explanation
// Approve/reject actions with reason input

'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RiskBadge, ProgressBar } from '@/components/autonomous/ui/CoreComponents';

interface ApprovalModalProps {
    approval: {
        id: string;
        ruleName: string;
        ruleId: string;
        actionName: string;
        actionId: string;
        riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        estimatedImpact: number;
        confidence: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        expiresAt: Date;
        cfoExplanation: {
            summary: string;
            whySafe: string[];
            warnings: string[];
            rollbackPlan: string;
            safetyGatesPassed: string[];
        };
    };
    onClose: () => void;
}

export function ApprovalModal({ approval, onClose }: ApprovalModalProps) {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [reason, setReason] = useState('');
    const queryClient = useQueryClient();

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/autonomous-analytics/approvals/${approval.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ performedBy: 'current_user' })
            });
            if (!response.ok) throw new Error('Failed to approve');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            toast.success('Persetujuan berhasil diberikan');
            onClose();
        }
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/autonomous-analytics/approvals/${approval.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    performedBy: 'current_user',
                    reason
                })
            });
            if (!response.ok) throw new Error('Failed to reject');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            toast.success('Persetujuan ditolak');
            onClose();
        }
    });

    const handleApprove = () => {
        if (confirm(`Approve ${approval.ruleName}?`)) {
            approveMutation.mutate();
        }
    };

    const handleReject = () => {
        if (!reason || reason.length < 20) {
            toast.error('Mohon berikan alasan (minimal 20 karakter)');
            return;
        }
        if (confirm(`Reject ${approval.ruleName}?`)) {
            rejectMutation.mutate();
        }
    };

    const isPending = approval.status === 'PENDING';

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{approval.ruleName}</h2>
                        <p className="text-sm text-gray-500 mt-1">{approval.actionName}</p>
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
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Risk Tier</div>
                            <div className="mt-1">
                                <RiskBadge tier={approval.riskTier} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Estimated Impact</div>
                            <div className="text-lg font-bold text-gray-900">
                                Rp {(approval.estimatedImpact / 1000000).toFixed(2)}jt
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Confidence</div>
                            <div className="mt-1">
                                <ProgressBar
                                    current={approval.confidence * 100}
                                    max={100}
                                    showPercentage={false}
                                />
                                <div className="text-xs text-gray-600 mt-1">
                                    {(approval.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CFO Explanation */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            CFO Explanation
                        </h3>
                        <p className="text-sm text-gray-700 mb-4">
                            {approval.cfoExplanation.summary}
                        </p>
                    </div>

                    {/* Why Safe */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">
                            ✓ Why This is Safe
                        </h4>
                        <ul className="space-y-1">
                            {approval.cfoExplanation.whySafe.map((item, i) => (
                                <li key={i} className="text-sm text-green-800 flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Warnings */}
                    {approval.cfoExplanation.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                                ⚠️ Warnings
                            </h4>
                            <ul className="space-y-1">
                                {approval.cfoExplanation.warnings.map((item, i) => (
                                    <li key={i} className="text-sm text-yellow-800 flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Rollback Plan */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Rollback Plan
                        </h4>
                        <p className="text-sm text-gray-700">
                            {approval.cfoExplanation.rollbackPlan}
                        </p>
                    </div>

                    {/* Safety Gates */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Safety Gates Passed
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {approval.cfoExplanation.safetyGatesPassed.map((gate, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    ✓ {gate}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Rejection Reason (if rejecting) */}
                    {action === 'reject' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason (required)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                                placeholder="Explain why you are rejecting this request..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum 20 characters
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {isPending && (
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                        {action === null ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAction('approve')}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                                >
                                    APPROVE
                                </button>
                                <button
                                    onClick={() => setAction('reject')}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                                >
                                    REJECT
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : action === 'approve' ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                                >
                                    {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                                </button>
                                <button
                                    onClick={() => setAction(null)}
                                    disabled={approveMutation.isPending}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                                >
                                    Back
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
                                >
                                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                                <button
                                    onClick={() => {
                                        setAction(null);
                                        setReason('');
                                    }}
                                    disabled={rejectMutation.isPending}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                                >
                                    Back
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
