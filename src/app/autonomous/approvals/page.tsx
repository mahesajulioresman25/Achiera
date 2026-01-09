// Approvals Page - Pending approvals and approval history
// Split view with detailed approval modal

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';
import { PendingApprovalsList } from '@/components/autonomous/lists/PendingApprovalsList';
import { ApprovalHistoryList } from '@/components/autonomous/lists/ApprovalHistoryList';
import { ApprovalModal } from '@/components/autonomous/modals/ApprovalModal';

import { useSearchParams } from 'next/navigation';

export default function ApprovalsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <ApprovalsContent />
        </React.Suspense>
    );
}

function ApprovalsContent() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

    // Fetch pending approvals
    const { data: pendingData, isLoading: loadingPending } = useQuery({
        queryKey: ['approvals', 'pending', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/approvals/pending?brandId=${brandId}`).then(r => r.json()),
        refetchInterval: 10000 // Refetch every 10 seconds
    });

    // Fetch approval history
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['approvals', 'history', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/approvals/history?brandId=${brandId}`).then(r => r.json()),
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Fetch selected approval details
    const { data: approvalDetails } = useQuery({
        queryKey: ['approval-details', selectedApprovalId],
        queryFn: () => fetch(`/api/autonomous-analytics/approvals/${selectedApprovalId}`).then(r => r.json()),
        enabled: !!selectedApprovalId
    });

    const pendingApprovals = pendingData?.approvals || [];
    const approvalHistory = historyData?.approvals || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Review and approve autonomous decision requests
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Approvals */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Pending Approvals
                                </h2>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    {pendingApprovals.length} pending
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingPending ? (
                                <LoadingSpinner />
                            ) : pendingApprovals.length === 0 ? (
                                <EmptyState
                                    title="No pending approvals"
                                    description="All approval requests have been processed"
                                />
                            ) : (
                                <PendingApprovalsList
                                    approvals={pendingApprovals}
                                    onSelectApproval={setSelectedApprovalId}
                                />
                            )}
                        </div>
                    </div>

                    {/* Approval History */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Approval History
                            </h2>
                        </div>

                        <div className="p-6">
                            {loadingHistory ? (
                                <LoadingSpinner />
                            ) : approvalHistory.length === 0 ? (
                                <EmptyState
                                    title="No approval history"
                                    description="No approvals have been processed yet"
                                />
                            ) : (
                                <ApprovalHistoryList
                                    approvals={approvalHistory}
                                    onSelectApproval={setSelectedApprovalId}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Modal */}
            {selectedApprovalId && approvalDetails && (
                <ApprovalModal
                    approval={approvalDetails}
                    onClose={() => setSelectedApprovalId(null)}
                />
            )}
        </div>
    );
}
