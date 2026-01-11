// Rule Details Panel - Expandable panel showing rule details
// Includes trust assessment, expansion eligibility, and actions

'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StatusBadge, ProgressBar } from '@/components/autonomous/ui/CoreComponents';
import PromptModal from '@/components/ui/PromptModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface RuleDetailsProps {
    rule: {
        ruleId: string;
        ruleName: string;
        autonomyLevel: 0 | 1 | 2 | 3;
        status: 'OK' | 'REVIEW' | 'PAUSE';
        trustScore: number;
        approvalRate: number;
        outcomeSuccessRate: number;
        daysAtLevel: number;
        totalExecutions: number;
        expansionEligible: boolean;
        expansionTargetLevel: number;
        expansionBlockers: string[];
        demotionRisk: 'none' | 'low' | 'medium' | 'high';
        demotionReasons: string[];
        recommendation: 'expand' | 'maintain' | 'demote';
    };
    onClose: () => void;
}

export function RuleDetailsPanel({ rule, onClose }: RuleDetailsProps) {
    const queryClient = useQueryClient();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [promptState, setPromptState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        callback: (value: string) => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        callback: () => { }
    });

    // Expand rule mutation
    const expandMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/autonomous-analytics/rules/${rule.ruleId}/expand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ performedBy: 'current_user' })
            });
            if (!response.ok) throw new Error('Failed to expand rule');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            queryClient.invalidateQueries({ queryKey: ['rule-details', rule.ruleId] });
            toast.success('Aturan berhasil diperluas');
        }
    });

    // Demote rule mutation
    const demoteMutation = useMutation({
        mutationFn: async (reason: string) => {
            const response = await fetch(`/api/autonomous-analytics/rules/${rule.ruleId}/demote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, performedBy: 'current_user' })
            });
            if (!response.ok) throw new Error('Failed to demote rule');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            queryClient.invalidateQueries({ queryKey: ['rule-details', rule.ruleId] });
            toast.success('Aturan berhasil diturunkan');
        }
    });

    // Pause rule mutation
    const pauseMutation = useMutation({
        mutationFn: async (reason: string) => {
            const response = await fetch(`/api/autonomous-analytics/rules/${rule.ruleId}/pause`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, performedBy: 'current_user' })
            });
            if (!response.ok) throw new Error('Failed to pause rule');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            queryClient.invalidateQueries({ queryKey: ['rule-details', rule.ruleId] });
            toast.success('Aturan berhasil dijeda');
        }
    });

    const handleExpand = () => {
        setIsConfirmOpen(true);
    };

    const handleDemote = () => {
        setPromptState({
            isOpen: true,
            title: 'Turunkan Level Aturan',
            message: 'Berikan alasan teknis atau performa mengapa aturan ini harus diturunkan levelnya (demoted).',
            callback: (reason: string) => {
                if (reason.length >= 10) {
                    demoteMutation.mutate(reason);
                } else {
                    toast.error('Mohon berikan alasan (minimal 10 karakter)');
                }
            }
        });
    };

    const handlePause = () => {
        setPromptState({
            isOpen: true,
            title: 'Jeda Operasi Aturan',
            message: 'Berikan alasan mengapa eksekusi otomatis untuk aturan ini harus dijeda sementara.',
            callback: (reason: string) => {
                if (reason.length >= 10) {
                    pauseMutation.mutate(reason);
                } else {
                    toast.error('Mohon berikan alasan (minimal 10 karakter)');
                }
            }
        });
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'expand': return 'text-green-600';
            case 'maintain': return 'text-blue-600';
            case 'demote': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{rule.ruleName}</h2>
                    <p className="text-sm text-gray-500 mt-1">{rule.ruleId}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                    <div className="text-sm text-gray-600">Current Level</div>
                    <div className="text-2xl font-bold text-gray-900">Level {rule.autonomyLevel}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-600">Trust Score</div>
                    <div className="text-2xl font-bold text-gray-900">{rule.trustScore}%</div>
                </div>
                <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1">
                        <StatusBadge status={rule.status} />
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-600">Days at Level</div>
                    <div className="text-2xl font-bold text-gray-900">{rule.daysAtLevel}</div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                <div className="space-y-3">
                    <ProgressBar
                        current={rule.approvalRate * 100}
                        max={100}
                        label={`Approval Rate: ${(rule.approvalRate * 100).toFixed(0)}%`}
                        showPercentage={false}
                    />
                    <ProgressBar
                        current={rule.outcomeSuccessRate * 100}
                        max={100}
                        label={`Outcome Success: ${(rule.outcomeSuccessRate * 100).toFixed(0)}%`}
                        showPercentage={false}
                    />
                    <div className="text-sm text-gray-600">
                        Total Executions: <span className="font-semibold">{rule.totalExecutions}</span>
                    </div>
                </div>
            </div>

            {/* Expansion Eligibility */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Expansion Eligibility</h3>
                {rule.expansionEligible ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <p className="text-sm text-green-800 font-medium mb-2">
                            ✅ Eligible for Level {rule.expansionTargetLevel}
                        </p>
                        <p className="text-xs text-green-700">
                            All requirements met for expansion
                        </p>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <p className="text-sm text-yellow-800 font-medium mb-2">
                            ❌ Not eligible for Level {rule.expansionTargetLevel}
                        </p>
                        <div className="text-xs text-yellow-700 space-y-1">
                            <p className="font-medium">Blockers:</p>
                            <ul className="list-disc list-inside">
                                {rule.expansionBlockers.map((blocker, i) => (
                                    <li key={i}>{blocker}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Demotion Risk */}
            {rule.demotionRisk !== 'none' && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Demotion Risk</h3>
                    <div className={`border rounded-md p-4 ${rule.demotionRisk === 'high' ? 'bg-red-50 border-red-200' :
                        rule.demotionRisk === 'medium' ? 'bg-orange-50 border-orange-200' :
                            'bg-yellow-50 border-yellow-200'
                        }`}>
                        <p className={`text-sm font-medium mb-2 ${rule.demotionRisk === 'high' ? 'text-red-800' :
                            rule.demotionRisk === 'medium' ? 'text-orange-800' :
                                'text-yellow-800'
                            }`}>
                            ⚠️ {rule.demotionRisk.toUpperCase()} Risk
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            {rule.demotionReasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Recommendation */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">System Recommendation</h3>
                <p className={`text-lg font-bold ${getRecommendationColor(rule.recommendation)}`}>
                    {rule.recommendation.toUpperCase()}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={handleExpand}
                    disabled={!rule.expansionEligible || expandMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {expandMutation.isPending ? 'Expanding...' : `Expand to L${rule.expansionTargetLevel}`}
                </button>
                <button
                    onClick={handleDemote}
                    disabled={rule.autonomyLevel === 0 || demoteMutation.isPending}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {demoteMutation.isPending ? 'Demoting...' : 'Demote'}
                </button>
                <button
                    onClick={handlePause}
                    disabled={pauseMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {pauseMutation.isPending ? 'Pausing...' : 'Pause Rule'}
                </button>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => expandMutation.mutate()}
                title="Perluas Aturan"
                description={`Apakah Bunda yakin ingin memperluas ${rule.ruleName} ke Level ${rule.expansionTargetLevel}?`}
                type="success"
            />

            <PromptModal
                isOpen={promptState.isOpen}
                onClose={() => setPromptState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={promptState.callback}
                title={promptState.title}
                message={promptState.message}
            />
        </div>
    );
}
