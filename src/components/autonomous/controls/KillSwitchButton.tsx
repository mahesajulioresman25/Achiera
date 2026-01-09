// Kill Switch Button - Emergency control to disable Level 3
// Prominent button with confirmation modal

'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KillSwitchButtonProps {
    brandId: string;
}

export function KillSwitchButton({ brandId }: KillSwitchButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [reason, setReason] = useState('');
    const queryClient = useQueryClient();

    const killSwitchMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/autonomous-analytics/dashboard/kill-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    level: 3,
                    performedBy: 'current_user', // TODO: Get from auth
                    reason
                })
            });

            if (!response.ok) throw new Error('Failed to activate kill switch');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exposure', brandId] });
            queryClient.invalidateQueries({ queryKey: ['rules', brandId] });
            setShowConfirm(false);
            setReason('');
            toast.success('Kill switch berhasil diaktifkan');
        },
        onError: (error) => {
            toast.error(`Gagal mengaktifkan kill switch: ${error.message}`);
        }
    });

    const handleActivate = () => {
        if (!reason || reason.length < 10) {
            toast.error('Mohon berikan alasan (minimal 10 karakter)');
            return;
        }
        killSwitchMutation.mutate();
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <span className="mr-2">🔴</span>
                Kill Switch - Level 3
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Confirm Kill Switch Activation
                        </h3>

                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-red-800">
                                <strong>Warning:</strong> This will immediately disable Level 3 autonomous execution for all rules.
                                Pending Level 3 executions will be cancelled.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason (required)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                                placeholder="Explain why you are activating the kill switch..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum 10 characters
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleActivate}
                                disabled={killSwitchMutation.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {killSwitchMutation.isPending ? 'Activating...' : 'Activate Kill Switch'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setReason('');
                                }}
                                disabled={killSwitchMutation.isPending}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
