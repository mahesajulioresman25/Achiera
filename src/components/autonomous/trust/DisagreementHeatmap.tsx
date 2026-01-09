import React from 'react';

interface DisagreementCluster {
    domain: string;
    count: number;
    warning_level: 'LOW' | 'HIGH';
}

interface DisagreementHeatmapProps {
    clusters: DisagreementCluster[];
    loading?: boolean;
}

export function DisagreementHeatmap({ clusters, loading }: DisagreementHeatmapProps) {
    if (loading) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-xl"></div>;
    }

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Human Trust Calibration Heatmap</h4>

            <div className="space-y-6">
                {clusters.map((cluster) => {
                    const bgClass = cluster.warning_level === 'HIGH' ? 'bg-red-50' : 'bg-green-50';
                    const textClass = cluster.warning_level === 'HIGH' ? 'text-red-700' : 'text-green-700';
                    const borderClass = cluster.warning_level === 'HIGH' ? 'border-red-100' : 'border-green-100';
                    const accentClass = cluster.warning_level === 'HIGH' ? 'bg-red-600' : 'bg-green-600';

                    return (
                        <div key={cluster.domain} className={`p-4 rounded-xl border ${bgClass} ${borderClass} relative overflow-hidden group transition-all`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black uppercase tracking-tight text-gray-400">{cluster.domain}</span>
                                <span className={`text-xs font-black ${textClass}`}>{cluster.count} Disagreements</span>
                            </div>

                            <div className="w-full bg-white bg-opacity-50 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${accentClass} transition-all duration-1000`}
                                    style={{ width: `${Math.min(cluster.count * 10, 100)}%` }}
                                ></div>
                            </div>

                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-[9px] text-gray-500 font-medium">Confidence Divergence: {cluster.warning_level === 'HIGH' ? 'Significant' : 'Marginal'}</span>
                                {cluster.warning_level === 'HIGH' && (
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></div>
                                        <span className="text-[8px] font-black text-red-600 uppercase">Attention Required</span>
                                    </div>
                                )}
                            </div>

                            {/* CFO/Auditor Tooltip Overlay */}
                            <div className="invisible group-hover:visible absolute inset-0 bg-gray-900 bg-opacity-95 p-4 flex flex-col justify-center transition-all">
                                <span className="text-[8px] font-black text-blue-400 uppercase mb-1">Auditor Analysis</span>
                                <p className="text-[10px] text-gray-300 leading-relaxed uppercase">
                                    {cluster.warning_level === 'HIGH'
                                        ? `Operators consistently hesitate on ${cluster.domain} decisions. Verify system metrics against domain context.`
                                        : `Human judgment matches system logic in ${cluster.domain} within acceptable variance.`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50 flex gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded bg-red-600"></div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">High Distrust</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded bg-green-600"></div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">High Alignment</span>
                </div>
            </div>
        </div>
    );
}
