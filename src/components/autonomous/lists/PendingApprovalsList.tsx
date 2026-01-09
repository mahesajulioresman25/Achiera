// Pending Approvals List - List of pending approval requests
// Shows key info and expiration countdown

'use client';

import React from 'react';
import { RiskBadge } from '@/components/autonomous/ui/CoreComponents';

interface Approval {
    id: string;
    ruleName: string;
    actionName: string;
    riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedImpact: number;
    expiresIn: string;
    expiresAt: Date;
    createdAt: Date;
}

interface PendingApprovalsListProps {
    approvals: Approval[];
    onSelectApproval: (id: string) => void;
}

export function PendingApprovalsList({ approvals, onSelectApproval }: PendingApprovalsListProps) {
    const getExpirationColor = (expiresAt: Date) => {
        const now = new Date();
        const diff = new Date(expiresAt).getTime() - now.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 1) return 'text-red-600';
        if (hours < 2) return 'text-orange-600';
        return 'text-gray-600';
    };

    return (
        <div className="space-y-3">
            {approvals.map((approval) => (
                <div
                    key={approval.id}
                    onClick={() => onSelectApproval(approval.id)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {approval.ruleName}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                                {approval.actionName}
                            </p>
                        </div>
                        <RiskBadge tier={approval.riskTier} size="sm" />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-600">
                            Impact: <span className="font-semibold">Rp {(approval.estimatedImpact / 1000).toFixed(0)}k</span>
                        </div>
                        <div className={`font-medium ${getExpirationColor(approval.expiresAt)}`}>
                            Expires: {approval.expiresIn}
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectApproval(approval.id);
                            }}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                        >
                            APPROVE
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectApproval(approval.id);
                            }}
                            className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                        >
                            REJECT
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
