import React from 'react';

interface QualityReport {
    acceptanceRatio: number;
    deferredAgingIndex: number;
    rejectionReasonClusters: { reason: string; count: number }[];
    status: 'HEALTHY' | 'NOISY' | 'LOW_SIGNAL' | 'INCONSISTENT';
    lastUpdated: string;
}

interface SuggestionQualityDashboardProps {
    report: QualityReport | null;
    loading?: boolean;
}

export function SuggestionQualityDashboard({ report, loading }: SuggestionQualityDashboardProps) {
    if (loading || !report) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-2xl border-2 border-dashed border-gray-100"></div>;
    }

    const statusColors = {
        HEALTHY: 'text-green-600 bg-green-50 border-green-100',
        NOISY: 'text-orange-600 bg-orange-50 border-orange-100',
        LOW_SIGNAL: 'text-blue-600 bg-blue-50 border-blue-100',
        INCONSISTENT: 'text-red-600 bg-red-50 border-red-100'
    };

    const acceptancePercent = (report.acceptanceRatio * 100).toFixed(0);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1">Suggestion Quality Audit</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                        Phase 3.5: Evaluating AI Sanity & Relevance
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest ${statusColors[report.status]}`}>
                    {report.status.replace('_', ' ')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metric A: Acceptance Ratio */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Quality Signal</span>
                    <div className="flex items-end gap-2 mb-2">
                        <div className="text-4xl font-black text-gray-800">{acceptancePercent}%</div>
                        <span className="text-xs font-bold text-gray-400 pb-1">Acceptance</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${report.acceptanceRatio < 0.4 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${acceptancePercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-4 italic">
                        {report.acceptanceRatio < 0.4 ? '⚠️ Divergence Threshold: High human friction detected.' : 'AI output matches human business judgment.'}
                    </p>
                </div>

                {/* Metric B: Aging Index */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Context Mismatch Index</span>
                    <div className="flex items-end gap-2 mb-2">
                        <div className="text-4xl font-black text-gray-800">{report.deferredAgingIndex.toFixed(1)}</div>
                        <span className="text-xs font-bold text-gray-400 pb-1">Days Deferred</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium mt-auto">
                        High aging indicates suggestions that are conceptually valid but lack timing or actionability context.
                    </p>
                </div>

                {/* Metric C: Cluster Insight */}
                <div className="p-6 bg-gray-900 rounded-2xl text-white">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Top Human Rejection Reasons</span>
                    <div className="space-y-4">
                        {report.rejectionReasonClusters.length > 0 ? report.rejectionReasonClusters.map((cluster, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="text-[10px] font-bold text-gray-300">{cluster.reason}</span>
                                <span className="text-[10px] font-black text-blue-400">{cluster.count}</span>
                            </div>
                        )) : (
                            <div className="text-[10px] text-gray-500 italic py-4">No rejection data available.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">
                    "Executive confidence does not equal system permission. Audit evaluates AI output quality only."
                </p>
            </div>
        </div>
    );
}
