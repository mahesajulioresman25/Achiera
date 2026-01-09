'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getAuditLogsAction,
    exportAuditLogsAction,
    getAuditStatisticsAction
} from '@/lib/actions/audit';
import { AuditAction, AuditSeverity } from '@prisma/client';
import {
    Search, Download, Filter, Clock, User,
    AlertCircle, CheckCircle, AlertTriangle, Shield
} from 'lucide-react';

interface AuditTrailViewerProps {
    brandId?: string;
}

export function AuditTrailViewer({ brandId }: AuditTrailViewerProps) {
    const [filters, setFilters] = useState({
        brandId,
        action: undefined as AuditAction | undefined,
        severity: undefined as AuditSeverity | undefined,
        searchQuery: '',
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined
    });

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: async () => {
            const result = await getAuditLogsAction({
                brandId: filters.brandId,
                action: filters.action,
                severity: filters.severity,
                startDate: filters.startDate,
                endDate: filters.endDate,
                limit: 100
            });
            return result.data || [];
        }
    });

    const { data: statsData } = useQuery({
        queryKey: ['audit-stats', brandId],
        queryFn: async () => {
            const result = await getAuditStatisticsAction(brandId, 30);
            return result.data;
        }
    });

    const handleExport = async () => {
        const result = await exportAuditLogsAction(filters);
        if (result.success && result.data) {
            const blob = new Blob([result.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-trail-${new Date().toISOString()}.csv`;
            a.click();
        }
    };

    const getSeverityIcon = (severity: AuditSeverity) => {
        switch (severity) {
            case 'INFO': return <CheckCircle className="text-blue-500" size={16} />;
            case 'WARNING': return <AlertTriangle className="text-yellow-500" size={16} />;
            case 'CRITICAL': return <AlertCircle className="text-red-500" size={16} />;
            case 'SECURITY': return <Shield className="text-purple-500" size={16} />;
        }
    };

    const getSeverityColor = (severity: AuditSeverity) => {
        switch (severity) {
            case 'INFO': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'WARNING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
            case 'SECURITY': return 'bg-purple-50 text-purple-700 border-purple-200';
        }
    };

    const formatActionName = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const filteredLogs = logsData?.filter(log => {
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                log.userName.toLowerCase().includes(query) ||
                log.entityType.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Audit Trail</h2>
                        <p className="text-sm text-slate-600 mt-1">Complete activity log for accountability</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>

                {/* Statistics Cards */}
                {statsData && (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Total Actions</div>
                            <div className="text-2xl font-black text-blue-900">{statsData.total.toLocaleString()}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Info</div>
                            <div className="text-2xl font-black text-green-900">{statsData.bySeverity.INFO || 0}</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <div className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Warnings</div>
                            <div className="text-2xl font-black text-yellow-900">{statsData.bySeverity.WARNING || 0}</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                            <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Critical</div>
                            <div className="text-2xl font-black text-red-900">
                                {(statsData.bySeverity.CRITICAL || 0) + (statsData.bySeverity.SECURITY || 0)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by user, entity, or action..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <select
                        value={filters.severity || ''}
                        onChange={(e) => setFilters({ ...filters, severity: e.target.value as AuditSeverity || undefined })}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Severities</option>
                        <option value="INFO">Info</option>
                        <option value="WARNING">Warning</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="SECURITY">Security</option>
                    </select>

                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <Filter size={16} />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Audit Log Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900">Activity Timeline</h3>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        Loading audit logs...
                    </div>
                ) : filteredLogs && filteredLogs.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredLogs.map((log: any) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* Severity Icon */}
                                    <div className="mt-1">
                                        {getSeverityIcon(log.severity)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500">
                                                {formatActionName(log.action)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="font-semibold text-slate-900">{log.userName}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600">{log.userRole}</span>
                                        </div>

                                        <div className="text-sm text-slate-700 mb-2">
                                            <span className="font-medium">{log.entityType}</span>
                                            <span className="text-slate-400 mx-2">→</span>
                                            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{log.entityId}</code>
                                        </div>

                                        {log.brand && (
                                            <div className="text-xs text-slate-500">
                                                Brand: <span className="font-medium">{log.brand.name}</span>
                                            </div>
                                        )}

                                        {log.changes && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium">
                                                    View Changes
                                                </summary>
                                                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs overflow-x-auto border border-slate-200">
                                                    {JSON.stringify(log.changes, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                            <Clock size={12} />
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </div>
                                        {log.ipAddress && (
                                            <div className="text-xs text-slate-400 mt-1">
                                                IP: {log.ipAddress}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No audit logs found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
