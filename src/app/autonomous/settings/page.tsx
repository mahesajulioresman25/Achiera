// Settings Page - System settings and executive controls
// Autonomy toggles, emergency controls, budget settings, policies

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/autonomous/ui/CoreComponents';
import { toast } from 'sonner';

import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <SettingsContent />
        </React.Suspense>
    );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    const userRole = 'CFO'; // Mock role for now, should come from auth context
    const queryClient = useQueryClient();
    const [editingBudget, setEditingBudget] = useState(false);
    const [budgetLimits, setBudgetLimits] = useState({
        daily_execution_limit: 10,
        daily_financial_cap: 5000000,
        weekly_execution_limit: 50,
        weekly_financial_cap: 20000000
    });

    // Fetch current settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/settings?brandId=${brandId}`).then(r => r.json())
    });

    // Toggle autonomy level mutation
    const toggleLevelMutation = useMutation({
        mutationFn: async ({ level, enabled }: { level: number; enabled: boolean }) => {
            const response = await fetch(`/api/autonomous-analytics/settings/autonomy-level`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    level,
                    enabled,
                    performedBy: 'current_user'
                })
            });
            if (!response.ok) throw new Error('Failed to toggle level');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', brandId] });
            toast.success('Tingkat otonomi diperbarui');
        }
    });

    // Emergency pause mutation
    const emergencyPauseMutation = useMutation({
        mutationFn: async () => {
            const reason = prompt('Reason for emergency pause (required):');
            if (!reason || reason.length < 10) {
                throw new Error('Reason required (minimum 10 characters)');
            }

            const response = await fetch(`/api/autonomous-analytics/settings/emergency-pause`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    reason,
                    performedBy: 'current_user'
                })
            });
            if (!response.ok) throw new Error('Failed to activate emergency pause');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', brandId] });
            toast.success('Jeda darurat diaktifkan');
        },
        onError: (error: Error) => {
            if (error.message !== 'Reason required (minimum 10 characters)') {
                toast.error(`Gagal: ${error.message}`);
            }
        }
    });

    // Update budget limits mutation (CFO only)
    const updateBudgetMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/autonomous-analytics/settings/budget-limits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    ...budgetLimits,
                    performedBy: 'current_user'
                })
            });
            if (!response.ok) throw new Error('Failed to update budget limits');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', brandId] });
            setEditingBudget(false);
            toast.success('Batas anggaran diperbarui');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const currentSettings = settings || {};

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure autonomous system controls and policies
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Autonomy Levels */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Autonomy Levels</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Enable or disable autonomous execution levels
                    </p>

                    <div className="space-y-4">
                        {[
                            { level: 1, name: 'Level 1 (Suggest)', description: 'Auto-rollback 24h, max 5 exec/day' },
                            { level: 2, name: 'Level 2 (Assisted)', description: 'Manual approval required' },
                            { level: 3, name: 'Level 3 (Guarded)', description: 'CFO approval, emergency rollback' }
                        ].map(({ level, name, description }) => (
                            <div key={level} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                                </div>
                                <button
                                    onClick={() => toggleLevelMutation.mutate({
                                        level,
                                        enabled: !currentSettings[`level${level}_enabled`]
                                    })}
                                    disabled={toggleLevelMutation.isPending || (level === 3 && userRole !== 'CFO')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSettings[`level${level}_enabled`]
                                        ? 'bg-green-600'
                                        : 'bg-gray-200'
                                        } disabled:opacity-50`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSettings[`level${level}_enabled`]
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>

                    {userRole !== 'CFO' && (
                        <p className="text-xs text-gray-500 mt-4">
                            ℹ️ Level 3 can only be toggled by CFO
                        </p>
                    )}
                </div>

                {/* Emergency Controls */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Controls</h2>

                    <div className="space-y-4">
                        {/* Emergency Pause */}
                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <h3 className="text-sm font-semibold text-red-900 mb-2">
                                ⏸️ Emergency Pause
                            </h3>
                            <p className="text-xs text-red-800 mb-4">
                                Halt ALL autonomous execution immediately. Use only in critical situations.
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Activate emergency pause? This will halt ALL autonomous execution.')) {
                                        emergencyPauseMutation.mutate();
                                    }
                                }}
                                disabled={emergencyPauseMutation.isPending || currentSettings.emergency_paused}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {currentSettings.emergency_paused
                                    ? 'Emergency Pause Active'
                                    : emergencyPauseMutation.isPending
                                        ? 'Activating...'
                                        : 'Activate Emergency Pause'
                                }
                            </button>
                        </div>

                        {/* Current Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Current Status</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Rules:</span>
                                    <span className="font-medium text-gray-900">{currentSettings.total_rules || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Rules:</span>
                                    <span className="font-medium text-gray-900">{currentSettings.active_rules || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Paused Rules:</span>
                                    <span className="font-medium text-gray-900">{currentSettings.paused_rules || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pending Executions:</span>
                                    <span className="font-medium text-gray-900">{currentSettings.pending_executions || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget Limits (CFO Only) */}
                {userRole === 'CFO' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Budget Limits</h2>
                            {!editingBudget && (
                                <button
                                    onClick={() => {
                                        setBudgetLimits({
                                            daily_execution_limit: currentSettings.daily_execution_limit || 10,
                                            daily_financial_cap: currentSettings.daily_financial_cap || 5000000,
                                            weekly_execution_limit: currentSettings.weekly_execution_limit || 50,
                                            weekly_financial_cap: currentSettings.weekly_financial_cap || 20000000
                                        });
                                        setEditingBudget(true);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {editingBudget ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Daily Execution Limit
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetLimits.daily_execution_limit}
                                            onChange={(e) => setBudgetLimits({ ...budgetLimits, daily_execution_limit: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Daily Financial Cap (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetLimits.daily_financial_cap}
                                            onChange={(e) => setBudgetLimits({ ...budgetLimits, daily_financial_cap: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weekly Execution Limit
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetLimits.weekly_execution_limit}
                                            onChange={(e) => setBudgetLimits({ ...budgetLimits, weekly_execution_limit: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weekly Financial Cap (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetLimits.weekly_financial_cap}
                                            onChange={(e) => setBudgetLimits({ ...budgetLimits, weekly_financial_cap: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => updateBudgetMutation.mutate()}
                                        disabled={updateBudgetMutation.isPending}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {updateBudgetMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setEditingBudget(false)}
                                        disabled={updateBudgetMutation.isPending}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600">Daily Execution Limit</div>
                                    <div className="font-medium text-gray-900">{currentSettings.daily_execution_limit || 10}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Daily Financial Cap</div>
                                    <div className="font-medium text-gray-900">Rp {((currentSettings.daily_financial_cap || 5000000) / 1000000).toFixed(1)}jt</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Weekly Execution Limit</div>
                                    <div className="font-medium text-gray-900">{currentSettings.weekly_execution_limit || 50}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Weekly Financial Cap</div>
                                    <div className="font-medium text-gray-900">Rp {((currentSettings.weekly_financial_cap || 20000000) / 1000000).toFixed(1)}jt</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Governance Policies */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Governance Policies</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        View official governance policies and procedures
                    </p>

                    <div className="space-y-2">
                        <a
                            href="/policies/autonomy-policy.pdf"
                            target="_blank"
                            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Autonomy Policy</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Decision authority, budget limits, rule lifecycle
                                    </p>
                                </div>
                                <span className="text-blue-600">→</span>
                            </div>
                        </a>

                        <a
                            href="/policies/escalation-policy.pdf"
                            target="_blank"
                            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Escalation Policy</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Issue escalation procedures and SLAs
                                    </p>
                                </div>
                                <span className="text-blue-600">→</span>
                            </div>
                        </a>

                        <a
                            href="/policies/incident-policy.pdf"
                            target="_blank"
                            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Incident Policy</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Incident handling and response procedures
                                    </p>
                                </div>
                                <span className="text-blue-600">→</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
