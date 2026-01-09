'use client';

import React, { useState, useEffect } from 'react';
import {
    getHoldingAuditHistoryAction
} from '@/lib/actions/holding';
import {
    Search,
    Filter,
    Calendar,
    User,
    Shield,
    Activity,
    ChevronRight,
    BadgeAlert,
    Clock,
    Eye,
    ArrowDownToLine,
    Database,
    AlertCircle,
    CheckCircle2,
    Info
} from 'lucide-react';

interface AuditLog {
    id: string;
    timestamp: Date;
    userName: string;
    userRole: string;
    action: string;
    entityType: string;
    entityId: string;
    severity: string;
    brand?: {
        name: string;
        slug: string;
    };
    metadata?: any;
    changes?: any;
}

export default function HoldingAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [selectedSeverity, selectedBrand]);

    const fetchLogs = async () => {
        setIsLoading(true);
        const res = await getHoldingAuditHistoryAction({
            severity: selectedSeverity || undefined,
            brandId: selectedBrand || undefined
        });
        if (res.success) {
            setLogs(res.logs);
        }
        setIsLoading(false);
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
            case 'SECURITY':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'WARNING':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'INFO':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
            case 'SECURITY':
                return <BadgeAlert className="w-3 h-3" />;
            case 'WARNING':
                return <AlertCircle className="w-3 h-3" />;
            case 'INFO':
                return <Info className="w-3 h-3" />;
            default:
                return <CheckCircle2 className="w-3 h-3" />;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Audit Control Center
                    </h3>
                    <p className="text-sm text-slate-500">Monitoring all operational maneuvers across the holding company</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all shadow-sm"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity:</span>
                    <select
                        value={selectedSeverity || ''}
                        onChange={(e) => setSelectedSeverity(e.target.value || null)}
                        className="text-[10px] font-bold bg-transparent focus:outline-none text-slate-600"
                    >
                        <option value="">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARNING">Warning</option>
                        <option value="INFO">Info</option>
                    </select>
                </div>

                {['CRITICAL', 'WARNING', 'INFO'].map(sev => (
                    <button
                        key={sev}
                        onClick={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedSeverity === sev
                                ? getSeverityStyles(sev)
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'
                            }`}
                    >
                        {sev}
                    </button>
                ))}
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-bottom border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Operator</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Entity</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Brand</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 bg-slate-50/30"></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No audit trails found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-3 h-3 opacity-40" />
                                                <span className="text-xs font-medium">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] opacity-40">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {log.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{log.userName}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap">{log.userRole}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">
                                                    {log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                <Database className="w-3 h-3 opacity-40" />
                                                {log.entityType}
                                                {/* <span className="opacity-40 text-[10px]">#{log.entityId.substring(0, 8)}</span> */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.brand ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                                                    {log.brand.name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Holding</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${getSeverityStyles(log.severity)}`}>
                                                {getSeverityIcon(log.severity)}
                                                {log.severity}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest px-2">
                <p>Displaying {filteredLogs.length} activity trails</p>
                <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    View Full Ledger <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
