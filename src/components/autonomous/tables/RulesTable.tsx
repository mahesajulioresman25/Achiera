// Rules Table - Sortable, filterable table of rules
// Shows key metrics and status

'use client';

import React from 'react';
import { StatusBadge } from '@/components/autonomous/ui/CoreComponents';

interface Rule {
    ruleId: string;
    ruleName: string;
    autonomyLevel: 0 | 1 | 2 | 3;
    status: 'OK' | 'REVIEW' | 'PAUSE';
    trustScore: number;
    approvalRate: number;
    triggerCount: number;
    isActive: boolean;
}

interface RulesTableProps {
    rules: Rule[];
    selectedRuleId: string | null;
    onSelectRule: (ruleId: string) => void;
}

export function RulesTable({ rules, selectedRuleId, onSelectRule }: RulesTableProps) {
    const getLevelBadge = (level: number) => {
        const colors = {
            0: 'bg-gray-100 text-gray-800',
            1: 'bg-blue-100 text-blue-800',
            2: 'bg-purple-100 text-purple-800',
            3: 'bg-indigo-100 text-indigo-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level as keyof typeof colors]}`}>
                L{level}
            </span>
        );
    };

    const getTrustColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rule Name
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trust Score
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Approval Rate
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Triggers
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {rules.map((rule) => (
                        <tr
                            key={rule.ruleId}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedRuleId === rule.ruleId ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => onSelectRule(rule.ruleId)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {rule.ruleName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {rule.ruleId}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {getLevelBadge(rule.autonomyLevel)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <StatusBadge status={rule.status} size="sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`text-sm font-semibold ${getTrustColor(rule.trustScore)}`}>
                                    {rule.trustScore}%
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900">
                                    {(rule.approvalRate * 100).toFixed(0)}%
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900">
                                    {rule.triggerCount}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectRule(rule.ruleId);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                    title="View Details"
                                >
                                    👁️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Open settings
                                    }}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Settings"
                                >
                                    ⚙️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
