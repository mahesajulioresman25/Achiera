// Pending Approvals Widget - Quick view of pending approval requests
// Shows count and list of pending items

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiskBadge, LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';
import Link from 'next/link';

interface PendingApprovalsWidgetProps {
    brandId: string;
}

export function PendingApprovalsWidget({ brandId }: PendingApprovalsWidgetProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['approvals', 'pending', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/approvals/pending?brandId=${brandId}`).then(r => r.json()),
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                <LoadingSpinner />
            </div>
        );
    }

    const approvals = data?.approvals || [];
    const count = approvals.length;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Pending Approvals
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {count} pending
                </span>
            </div>

            {count === 0 ? (
                <EmptyState
                    title="No pending approvals"
                    description="All approval requests have been processed"
                />
            ) : (
                <div className="space-y-3">
                    {approvals.slice(0, 3).map((approval: any) => (
                        <div key={approval.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">{approval.ruleName}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{approval.actionName}</p>
                                </div>
                                <RiskBadge tier={approval.riskTier} size="sm" />
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-600">
                                <span>Impact: Rp {(approval.estimatedImpact / 1000).toFixed(0)}k</span>
                                <span>Expires: {approval.expiresIn}</span>
                            </div>
                        </div>
                    ))}

                    {count > 3 && (
                        <div className="text-center pt-2">
                            <Link
                                href="/autonomous/approvals"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View all {count} approvals →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                    href="/autonomous/approvals"
                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    View All Approvals
                </Link>
            </div>
        </div>
    );
}
