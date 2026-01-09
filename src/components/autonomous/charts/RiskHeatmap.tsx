// Risk Heatmap - Matrix showing rules by risk tier and autonomy level
// Interactive heatmap with drill-down capability

'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/autonomous/ui/CoreComponents';

interface RiskHeatmapData {
    cells: Array<{
        autonomy_level: 0 | 1 | 2 | 3;
        risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        rule_count: number;
        total_executions: number;
        rollback_rate: number;
        approval_rate: number;
        rules: Array<{
            ruleId: string;
            ruleName: string;
            status: 'OK' | 'REVIEW' | 'PAUSE';
        }>;
    }>;
}

export function RiskHeatmap({ data }: { data: RiskHeatmapData }) {
    const [selectedCell, setSelectedCell] = useState<any>(null);

    if (!data || !data.cells) {
        return <div className="text-center text-gray-500">No data available</div>;
    }

    const levels = [0, 1, 2, 3];
    const risks: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    // Create matrix
    const matrix: Record<number, Record<string, any>> = {};
    levels.forEach(level => {
        matrix[level] = {};
        risks.forEach(risk => {
            const cell = data.cells.find(c => c.autonomy_level === level && c.risk_tier === risk);
            matrix[level][risk] = cell || { rule_count: 0, total_executions: 0, rules: [] };
        });
    });

    const getCellColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 text-gray-400';
        if (count <= 2) return 'bg-green-100 text-green-800';
        if (count <= 5) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div>
            {/* Heatmap Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Level / Risk
                            </th>
                            {risks.map(risk => (
                                <th key={risk} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {risk}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {levels.map(level => (
                            <tr key={level}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Level {level}
                                </td>
                                {risks.map(risk => {
                                    const cell = matrix[level][risk];
                                    return (
                                        <td
                                            key={risk}
                                            className={`px-6 py-4 whitespace-nowrap text-center cursor-pointer hover:opacity-80 transition-opacity ${getCellColor(cell.rule_count)}`}
                                            onClick={() => cell.rule_count > 0 && setSelectedCell(cell)}
                                        >
                                            <div className="text-2xl font-bold">{cell.rule_count}</div>
                                            {cell.total_executions > 0 && (
                                                <div className="text-xs mt-1">
                                                    {cell.total_executions} exec
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Selected Cell Details */}
            {selectedCell && selectedCell.rules.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Level {selectedCell.autonomy_level} - {selectedCell.risk_tier} Risk
                        </h3>
                        <button
                            onClick={() => setSelectedCell(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <div className="text-sm text-gray-600">Rules</div>
                            <div className="text-xl font-bold">{selectedCell.rule_count}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Approval Rate</div>
                            <div className="text-xl font-bold">{(selectedCell.approval_rate * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Rollback Rate</div>
                            <div className="text-xl font-bold">{(selectedCell.rollback_rate * 100).toFixed(0)}%</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Rules:</h4>
                        <div className="space-y-2">
                            {selectedCell.rules.map((rule: any) => (
                                <div key={rule.ruleId} className="flex justify-between items-center bg-white p-2 rounded">
                                    <span className="text-sm">{rule.ruleName}</span>
                                    <StatusBadge status={rule.status} size="sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
