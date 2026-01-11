'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getComplianceDashboardAction,
    getComplianceViolationsAction,
    resolveViolationAction,
    waiveViolationAction
} from '@/lib/actions/audit';
import {
    Shield, TrendingUp, TrendingDown, Minus,
    AlertCircle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import PromptModal from '@/components/ui/PromptModal';

interface ComplianceDashboardProps {
    brandId?: string;
}

export function ComplianceDashboard({ brandId }: ComplianceDashboardProps) {
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

    const { data: dashboardData, isLoading, refetch } = useQuery({
        queryKey: ['compliance-dashboard', brandId],
        queryFn: async () => {
            const result = await getComplianceDashboardAction(brandId);
            return result.data;
        }
    });

    const { data: violationsData } = useQuery({
        queryKey: ['compliance-violations', brandId],
        queryFn: async () => {
            const result = await getComplianceViolationsAction({
                brandId,
                status: 'OPEN'
            });
            return result.data || [];
        }
    });

    const handleResolve = (violationId: string) => {
        setPromptState({
            isOpen: true,
            title: 'Selesaikan Pelanggaran',
            message: 'Masukkan catatan resolusi untuk menutup isu ini secara permanen.',
            callback: async (resolution: string) => {
                await resolveViolationAction(violationId, 'current-user-id', resolution);
                refetch();
            }
        });
    };

    const handleWaive = (violationId: string) => {
        setPromptState({
            isOpen: true,
            title: 'Pengecualian Isu',
            message: 'Masukkan alasan mengapa pelanggaran ini harus diabaikan (waived).',
            callback: async (reason: string) => {
                await waiveViolationAction(violationId, 'current-user-id', reason);
                refetch();
            }
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 90) return 'from-green-500 to-emerald-600';
        if (score >= 70) return 'from-yellow-500 to-orange-600';
        return 'from-red-500 to-rose-600';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'IMPROVING': return <TrendingUp className="text-green-500" size={20} />;
            case 'DECLINING': return <TrendingDown className="text-red-500" size={20} />;
            default: return <Minus className="text-slate-400" size={20} />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors = {
            CRITICAL: 'bg-red-100 text-red-700 border-red-300',
            HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
            MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            LOW: 'bg-blue-100 text-blue-700 border-blue-300'
        };
        return colors[severity as keyof typeof colors] || colors.LOW;
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="text-center text-slate-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    Loading compliance data...
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className="space-y-6">
            {/* Header with Score */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black mb-1">Compliance Overview</h2>
                            <p className="text-indigo-100">Governance & Risk Management</p>
                        </div>
                        <Shield size={48} className="opacity-50" />
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Compliance Score */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4 relative">
                                <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${getScoreGradient(dashboardData.overallScore)} opacity-20`}></div>
                                <div className={`text-4xl font-black ${getScoreColor(dashboardData.overallScore)} relative z-10`}>
                                    {dashboardData.overallScore}
                                </div>
                            </div>
                            <div className="text-sm font-bold text-slate-700 uppercase tracking-wider">Compliance Score</div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                {getTrendIcon(dashboardData.trend)}
                                <span className="text-xs font-medium text-slate-600">
                                    {dashboardData.trend === 'IMPROVING' ? 'Improving' :
                                        dashboardData.trend === 'DECLINING' ? 'Declining' : 'Stable'}
                                </span>
                            </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Active Rules</div>
                                <div className="text-2xl font-black text-blue-900">{dashboardData.activeRules}</div>
                                <div className="text-xs text-blue-600 mt-1">of {dashboardData.totalRules} total</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Resolved</div>
                                <div className="text-2xl font-black text-green-900">
                                    {dashboardData.totalViolations - dashboardData.openViolations}
                                </div>
                                <div className="text-xs text-green-600 mt-1">violations</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <div className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Open Issues</div>
                                <div className="text-2xl font-black text-yellow-900">{dashboardData.openViolations}</div>
                                <div className="text-xs text-yellow-600 mt-1">pending</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Critical</div>
                                <div className="text-2xl font-black text-red-900">{dashboardData.criticalViolations}</div>
                                <div className="text-xs text-red-600 mt-1">urgent</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Violations */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900">Active Violations ({dashboardData.openViolations})</h3>
                </div>

                {violationsData && violationsData.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {violationsData.map((violation: any) => (
                            <div key={violation.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {violation.severity === 'CRITICAL' ? (
                                            <AlertCircle className="text-red-500" size={20} />
                                        ) : (
                                            <AlertCircle className="text-yellow-500" size={20} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(violation.severity)}`}>
                                                {violation.severity}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {violation.rule.category.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 mb-1">{violation.rule.name}</h4>
                                        <p className="text-sm text-slate-600 mb-2">{violation.description}</p>

                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(violation.createdAt).toLocaleDateString()}
                                            </div>
                                            {violation.brand && (
                                                <div>Brand: {violation.brand.name}</div>
                                            )}
                                            {violation.user && (
                                                <div>User: {violation.user.name}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResolve(violation.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            <CheckCircle size={14} />
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => handleWaive(violation.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                                        >
                                            <XCircle size={14} />
                                            Waive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-500" />
                        <p className="font-medium text-slate-600">No active violations</p>
                        <p className="text-sm mt-1">All compliance rules are being followed</p>
                    </div>
                )}
            </div>

            {/* Violations by Category */}
            {Object.keys(dashboardData.violationsByCategory).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Violations by Category</h3>
                    <div className="space-y-3">
                        {Object.entries(dashboardData.violationsByCategory).map(([category, count]) => (
                            <div key={category} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">
                                            {category.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">{count as number}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                            style={{ width: `${Math.min(100, ((count as number) / dashboardData.totalViolations) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
