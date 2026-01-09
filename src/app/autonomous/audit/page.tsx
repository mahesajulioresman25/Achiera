// Audit Page - Audit logs viewer with export functionality
// Filterable log table with CSV/PDF export

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, EmptyState } from '@/components/autonomous/ui/CoreComponents';

import { useSearchParams } from 'next/navigation';

export default function AuditPage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';
    const [dateRange, setDateRange] = useState<'7days' | '30days' | 'custom'>('7days');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    // Fetch audit logs
    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', brandId, dateRange, eventTypeFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                brandId,
                dateRange,
                ...(eventTypeFilter !== 'all' && { eventType: eventTypeFilter })
            });
            const response = await fetch(`/api/autonomous-analytics/audit/logs?${params}`);
            return response.json();
        }
    });

    const handleExportCSV = async () => {
        const response = await fetch(`/api/autonomous-analytics/audit/export/csv?brandId=${brandId}&dateRange=${dateRange}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${brandId}-${new Date().toISOString()}.csv`;
        a.click();
    };

    const handleExportPDF = async () => {
        const response = await fetch(`/api/autonomous-analytics/audit/export/pdf?brandId=${brandId}&dateRange=${dateRange}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${brandId}-${new Date().toISOString()}.pdf`;
        a.click();
    };

    const logs = data?.logs || [];
    const selectedLog = logs.find((log: any) => log.id === selectedLogId);

    const eventTypes = [
        { value: 'all', label: 'All Events' },
        { value: 'execution', label: 'Executions' },
        { value: 'approval', label: 'Approvals' },
        { value: 'override', label: 'Overrides' },
        { value: 'rollback', label: 'Rollbacks' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Complete audit trail of all autonomous actions
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                            >
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Range
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: '7days', label: 'Last 7 Days' },
                                    { value: '30days', label: 'Last 30 Days' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setDateRange(option.value as any)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${dateRange === option.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Event Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Type
                            </label>
                            <select
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {eventTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-lg shadow">
                    {isLoading ? (
                        <div className="p-6">
                            <LoadingSpinner />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="No audit logs found"
                                description="No logs match the selected filters"
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Event Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Performed By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Details
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(log.timestamp).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {log.eventType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.performedBy}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {log.summary || 'No details'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => setSelectedLogId(log.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Selected Log Details */}
                {selectedLog && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Audit Entry Details</h3>
                            <button
                                onClick={() => setSelectedLogId(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Timestamp</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Event Type</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {selectedLog.eventType}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Performed By</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {selectedLog.performedBy}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Brand ID</div>
                                    <div className="text-sm font-mono text-gray-900">
                                        {selectedLog.brandId}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-2">Metadata</div>
                                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
