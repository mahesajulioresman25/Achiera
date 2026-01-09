import React from 'react';

interface AutonomyReadinessGaugeProps {
    score: number;
    status: 'NOT_READY' | 'CONDITIONAL' | 'READY_FOR_REVIEW';
    blockingFactors: string[];
    loading?: boolean;
}

export function AutonomyReadinessGauge({ score, status, blockingFactors, loading }: AutonomyReadinessGaugeProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="flex justify-center py-6">
                    <div className="h-32 w-32 rounded-full border-8 border-gray-100"></div>
                </div>
            </div>
        );
    }

    const statusColors = {
        NOT_READY: 'text-red-600 bg-red-50 border-red-100',
        CONDITIONAL: 'text-orange-600 bg-orange-50 border-orange-100',
        READY_FOR_REVIEW: 'text-green-600 bg-green-50 border-green-100'
    };

    const ringColor = score >= 85 ? 'stroke-green-500' : score >= 60 ? 'stroke-orange-500' : 'stroke-red-500';

    return (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Promotion Readiness Score</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Weighted risk evaluation for Autonomy Level 1</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[status]}`}>
                    {status.replace(/_/g, ' ')}
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center py-4">
                <div className="relative h-48 w-48">
                    {/* Background Ring */}
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle className="stroke-gray-100 fill-none" cx="50" cy="50" r="45" strokeWidth="8" />
                        <circle
                            className={`${ringColor} fill-none transition-all duration-1000 ease-out`}
                            cx="50" cy="50" r="45"
                            strokeWidth="8"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * score) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-gray-800">{score.toFixed(0)}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase">/ 100</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Risk Analysis / Blocking Factors</h4>
                {blockingFactors.length > 0 ? (
                    <div className="space-y-2">
                        {blockingFactors.map((factor, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-xs text-red-600 bg-red-50 p-2 rounded border border-red-50">
                                <span className="font-bold">⚠</span>
                                <span>{factor}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-2 items-start text-xs text-green-600 bg-green-50 p-2 rounded border border-green-50">
                        <span className="font-bold">✓</span>
                        <span>All safety thresholds met for Level 1 consideration.</span>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                <p className="text-[9px] text-gray-400 italic">This score indicates eligibility for review. System remains locked in OBSERVE mode.</p>
            </div>
        </div>
    );
}
