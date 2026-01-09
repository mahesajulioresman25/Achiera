import React from 'react';

interface Cluster {
    domain: string;
    concentration_pct: number;
    top_rules: string[];
    warning_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RiskConcentrationHeatmapProps {
    clusters: Cluster[];
    loading?: boolean;
}

export function RiskConcentrationHeatmap({ clusters, loading }: RiskConcentrationHeatmapProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Risk Concentration Heatmap</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clusters.map((cluster) => {
                    const bgColor = cluster.warning_level === 'HIGH' ? 'bg-red-50' : cluster.warning_level === 'MEDIUM' ? 'bg-orange-50' : 'bg-green-50';
                    const borderColor = cluster.warning_level === 'HIGH' ? 'border-red-100' : cluster.warning_level === 'MEDIUM' ? 'border-orange-100' : 'border-green-100';
                    const textColor = cluster.warning_level === 'HIGH' ? 'text-red-700' : cluster.warning_level === 'MEDIUM' ? 'text-orange-700' : 'text-green-700';

                    return (
                        <div key={cluster.domain} className={`p-4 rounded-xl border-2 ${bgColor} ${borderColor} transition-transform hover:scale-[1.02] cursor-default group relative`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black uppercase tracking-tighter text-gray-400">{cluster.domain}</span>
                                <span className={`text-lg font-black ${textColor}`}>{(cluster.concentration_pct * 100).toFixed(1)}%</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                                <div
                                    className={`h-1.5 rounded-full ${cluster.warning_level === 'HIGH' ? 'bg-red-500' : cluster.warning_level === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.max(cluster.concentration_pct * 100, 5)}%` }}
                                ></div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Top Exposure Rules</span>
                                {cluster.top_rules.map((rule, idx) => (
                                    <div key={idx} className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                                        <span className="opacity-30">•</span> {rule}
                                    </div>
                                ))}
                            </div>

                            {/* CFO Advisory Tooltip */}
                            <div className="invisible group-hover:visible absolute inset-0 bg-gray-900 bg-opacity-95 rounded-xl p-4 flex flex-col justify-center text-white z-20">
                                <span className="text-[9px] font-black text-blue-400 uppercase mb-1">CFO Risk Analysis</span>
                                <p className="text-[10px] leading-relaxed">
                                    {cluster.warning_level === 'HIGH'
                                        ? `Concentrated failures detected in ${cluster.domain}. Potential financial impact volatility is HIGH. Review safety gates immediately.`
                                        : cluster.warning_level === 'MEDIUM'
                                            ? `Sparse data or edge cases in ${cluster.domain} resulting in moderate uncertainty. Systemic risk exists.`
                                            : `Operational trust is stable in ${cluster.domain}. No significant risk clusters detected.`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">SKU Volatility</span>
                    <span className="text-[11px] font-bold text-gray-700">Frozen High</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Seasonality Risk</span>
                    <span className="text-[11px] font-bold text-gray-700">Moderate</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Data Sparsity</span>
                    <span className="text-[11px] font-bold text-gray-700">Low (7d Avg)</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Board Concern</span>
                    <span className="text-[11px] font-bold text-red-500">Inventory Failures</span>
                </div>
            </div>
        </div>
    );
}
