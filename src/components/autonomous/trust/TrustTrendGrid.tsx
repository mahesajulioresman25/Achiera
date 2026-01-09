import React from 'react';

interface TrendMetric {
    label: string;
    key: string;
    description: string;
}

interface TrustTrendGridProps {
    data7d: any;
    data14d: any;
    data30d: any;
    loading?: boolean;
}

const METRICS: TrendMetric[] = [
    { label: 'Rule Acceptance', key: 'rule_acceptance', description: 'Human approval rate of AI decisions.' },
    { label: 'AI Agreement', key: 'ai_agreement', description: 'Internal deterministic vs AI model alignment.' },
    { label: 'Rollback Freq', key: 'rollback_rate', description: 'Percentage of actions reversed.' },
    { label: 'Avg Confidence', key: 'avg_confidence', description: 'Mean uncertainty score of evaluations.' },
    { label: 'Gate Failures', key: 'safety_gate_failures', description: 'Internal safety violation rate.' }
];

export function TrustTrendGrid({ data7d, data14d, data30d, loading }: TrustTrendGridProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow p-6 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 rounded"></div>)}
                </div>
            </div>
        );
    }

    const formatValue = (val: number, key: string) => {
        if (key === 'avg_confidence') return val.toFixed(2);
        return `${(val * 100).toFixed(1)}%`;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Temporal Trust Trends</h3>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-black uppercase">Audited Dataset</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">System Metric</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">7 Day</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">14 Day</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">30 Day</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {METRICS.map((metric) => (
                            <tr key={metric.key} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">{metric.label}</span>
                                        <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{metric.description}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-mono font-black text-gray-600">
                                        {data7d ? formatValue(data7d[metric.key], metric.key) : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-mono font-black text-gray-600">
                                        {data14d ? formatValue(data14d[metric.key], metric.key) : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-xs font-mono font-black px-2 py-1 rounded ${metric.key === 'rollback_rate' && data30d?.[metric.key] > 0.02 ? 'bg-red-50 text-red-600' : 'text-gray-900'}`}>
                                        {data30d ? formatValue(data30d[metric.key], metric.key) : '—'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold text-xs mt-0.5">ℹ</span>
                    <p className="text-[9px] text-gray-500 leading-normal font-medium">
                        All trends are computed daily at 00:00 UTC. Previous period variances exceeding 5% are flagged for manual review by the Risk Committee.
                    </p>
                </div>
            </div>
        </div>
    );
}
