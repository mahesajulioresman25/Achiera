// Approval History List - List of past approvals/rejections
// Shows status and who approved/rejected

'use client';

import React from 'react';

interface ApprovalHistory {
    id: string;
    ruleName: string;
    actionName: string;
    status: 'APPROVED' | 'REJECTED' | 'EXPIRED';
    approvedBy?: string;
    rejectedBy?: string;
    reason?: string;
    processedAt: Date;
    timeAgo: string;
}

interface ApprovalHistoryListProps {
    approvals: ApprovalHistory[];
    onSelectApproval: (id: string) => void;
}

export function ApprovalHistoryList({ approvals, onSelectApproval }: ApprovalHistoryListProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return '✅';
            case 'REJECTED': return '❌';
            case 'EXPIRED': return '⏱️';
            default: return '•';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600';
            case 'REJECTED': return 'text-red-600';
            case 'EXPIRED': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {approvals.map((approval) => (
                <div
                    key={approval.id}
                    onClick={() => onSelectApproval(approval.id)}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    <div className="flex items-start space-x-2 mb-2">
                        <span className="text-lg">{getStatusIcon(approval.status)}</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                                {approval.ruleName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {approval.actionName}
                            </p>
                        </div>
                        <span className={`text-xs font-medium ${getStatusColor(approval.status)}`}>
                            {approval.status}
                        </span>
                    </div>

                    <div className="text-xs text-gray-600">
                        {approval.status === 'APPROVED' && approval.approvedBy && (
                            <p>Approved by: <span className="font-medium">{approval.approvedBy}</span></p>
                        )}
                        {approval.status === 'REJECTED' && approval.rejectedBy && (
                            <div>
                                <p>Rejected by: <span className="font-medium">{approval.rejectedBy}</span></p>
                                {approval.reason && (
                                    <p className="text-gray-500 italic mt-1">"{approval.reason}"</p>
                                )}
                            </div>
                        )}
                        <p className="mt-1">{approval.timeAgo}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
