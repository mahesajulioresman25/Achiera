'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogsAction } from '@/lib/actions/audit';
import { AuditSeverity } from '@prisma/client';
import {
    Activity, Pause, Play, Filter,
    CheckCircle, AlertTriangle, AlertCircle, Shield
} from 'lucide-react';

interface ActivityMonitorProps {
    brandId?: string;
    autoRefresh?: boolean;
    refreshInterval?: number; // in seconds
}

export function ActivityMonitor({
    brandId,
    autoRefresh = true,
    refreshInterval = 10
}: ActivityMonitorProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'ALL'>('ALL');

    const { data: logsData, refetch } = useQuery({
        queryKey: ['activity-monitor', brandId, severityFilter],
        queryFn: async () => {
            const result = await getAuditLogsAction({
                brandId,
                severity: severityFilter !== 'ALL' ? severityFilter : undefined,
                limit: 20
            });
            return result.data || [];
        },
        refetchInterval: !isPaused && autoRefresh ? refreshInterval * 1000 : false
    });

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
            case 'INFO': return 'border-l-blue-500 bg-blue-50';
            case 'WARNING': return 'border-l-yellow-500 bg-yellow-50';
            case 'CRITICAL': return 'border-l-red-500 bg-red-50';
            case 'SECURITY': return 'border-l-purple-500 bg-purple-50';
        }
    };

    const formatActionName = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(timestamp).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-900">Live Activity Monitor</h3>
                        {!isPaused && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Severity Filter */}
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value as AuditSeverity | 'ALL')}
                            className="text-xs px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ALL">All</option>
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="SECURITY">Security</option>
                        </select>

                        {/* Pause/Play Button */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${isPaused
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-slate-600 text-white hover:bg-slate-700'
                                }`}
                        >
                            {isPaused ? (
                                <>
                                    <Play size={12} />
                                    Resume
                                </>
                            ) : (
                                <>
                                    <Pause size={12} />
                                    Pause
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="max-h-[600px] overflow-y-auto">
                {logsData && logsData.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {logsData.map((log: any, index: number) => (
                            <div
                                key={log.id}
                                className={`p-3 border-l-4 ${getSeverityColor(log.severity)} hover:bg-slate-50 transition-all duration-200`}
                                style={{
                                    animation: index === 0 && !isPaused ? 'slideIn 0.3s ease-out' : 'none'
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getSeverityIcon(log.severity)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {log.userName}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-600">
                                                {formatActionName(log.action)}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-600 mb-1">
                                            <span className="font-medium">{log.entityType}</span>
                                            {log.brand && (
                                                <>
                                                    <span className="text-slate-400 mx-1">in</span>
                                                    <span className="font-medium">{log.brand.name}</span>
                                                </>
                                            )}
                                        </div>

                                        {log.metadata && log.metadata.description && (
                                            <div className="text-xs text-slate-500 mt-1">
                                                {log.metadata.description}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex-shrink-0 text-xs text-slate-400">
                                        {getTimeAgo(log.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400">
                        <Activity size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No recent activity</p>
                        <p className="text-sm mt-1">Activity will appear here in real-time</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
                <p className="text-xs text-slate-500">
                    {isPaused ? (
                        'Updates paused'
                    ) : (
                        `Auto-refreshing every ${refreshInterval} seconds`
                    )}
                </p>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
