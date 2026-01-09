import React, { useState } from 'react';
import { RiskBadge, StatusBadge } from '../ui/CoreComponents';
import { format } from 'date-fns';
import { AgreementSamplingCard } from '../trust/AgreementSamplingCard';

interface DecisionLogItem {
    id: string;
    decisionId?: string; // Standardized field
    ruleId: string;
    ruleName: string;
    domain?: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    suggestedAction: string;
    impactAmount?: number;
    currency?: string;
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING' | 'SIMULATED';
    executedAt: Date;
    metadata?: any;
    blockReason?: string;
}

interface DecisionAuditTableProps {
    brandId: string;
    data: DecisionLogItem[];
    loading?: boolean;
}

export function DecisionAuditTable({ brandId, data, loading }: DecisionAuditTableProps) {
    const [selectedItem, setSelectedItem] = useState<DecisionLogItem | null>(null);

    if (loading) {
        return (
            <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                <div className="h-10 bg-gray-50 border-b border-gray-200"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b border-gray-100 px-6 flex items-center gap-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="flex-grow"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                <p>No decision history found for this brand.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Tier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Impact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Trace</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {format(new Date(item.executedAt), 'MMM d, HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600 truncate max-w-[200px]" title={item.ruleName}>
                                        {item.ruleName}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono">{item.ruleId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <RiskBadge tier={item.riskLevel} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                    {item.suggestedAction}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.impactAmount ? `${item.currency || 'IDR'} ${item.impactAmount.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <StatusBadge
                                            status={item.status === 'SUCCESS' ? 'OK' : item.status === 'PENDING' ? 'REVIEW' : 'PAUSE'}
                                            size="sm"
                                        />
                                        {item.status === 'BLOCKED' && item.blockReason && (
                                            <span className="text-[10px] text-red-500 font-medium max-w-[120px] truncate" title={item.blockReason}>
                                                Reason: {item.blockReason}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="View Evaluation Metadata"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Traceability Modal (Read-Only JSON View) */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Decision Governance Audit</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                            {/* Metadata View */}
                            <div className="flex-1 p-6 overflow-y-auto bg-gray-900 border-r border-gray-800">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 block">Raw Trace Metadata</span>
                                <pre className="font-mono text-[10px] text-blue-300 leading-relaxed">
                                    {JSON.stringify({
                                        ruleId: selectedItem.ruleId,
                                        ruleName: selectedItem.ruleName,
                                        status: selectedItem.status,
                                        riskLevel: selectedItem.riskLevel,
                                        metadata: selectedItem.metadata,
                                        blockReason: selectedItem.blockReason
                                    }, null, 2)}
                                </pre>
                            </div>

                            {/* Calibration Sidebar */}
                            <div className="w-full md:w-[350px] p-6 bg-gray-50 overflow-y-auto">
                                <AgreementSamplingCard
                                    decisionId={selectedItem.decisionId || selectedItem.id}
                                    brandId={brandId}
                                />

                                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex items-start gap-2 text-orange-600">
                                        <span className="font-bold">⚠</span>
                                        <p className="text-[10px] leading-relaxed italic">
                                            Calibration helps the system understand the "Human Signal Delta". No changes to live rules will occur.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 italic">Deterministic Audit Trail - Observe Only Mode Active</span>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
