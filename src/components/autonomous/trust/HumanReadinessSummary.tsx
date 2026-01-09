import React from 'react';

interface HumanReadinessSummaryProps {
    alignment: 'LOW' | 'MEDIUM' | 'HIGH';
    concerns: string[];
    recommendation: 'CONTINUE OBSERVE' | 'EXTEND CALIBRATION';
    loading?: boolean;
}

export function HumanReadinessSummary({ alignment, concerns, recommendation, loading }: HumanReadinessSummaryProps) {
    if (loading) {
        return <div className="h-48 bg-gray-50 animate-pulse rounded-xl"></div>;
    }

    const alignmentColors = {
        LOW: 'text-red-600 bg-red-50 border-red-100',
        MEDIUM: 'text-orange-600 bg-orange-50 border-orange-100',
        HIGH: 'text-green-600 bg-green-50 border-green-100'
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Human Readiness Summary</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Qualitative alignment audit between operators & system</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${alignmentColors[alignment]}`}>
                    {alignment} ALIGNMENT
                </div>
            </div>

            <div className="flex-grow space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Primary Auditor Concerns</span>
                    {concerns.length > 0 ? (
                        <ul className="space-y-2">
                            {concerns.map((concern, idx) => (
                                <li key={idx} className="text-[10px] text-gray-600 flex gap-2 items-start italic leading-relaxed">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>{concern}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[10px] text-green-600 italic">No significant trust gaps detected in the current calibration cycle.</p>
                    )}
                </div>

                <div className="bg-blue-600 rounded-lg p-4 text-white">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-1 block">Governance Recommendation</span>
                    <p className="text-lg font-black tracking-tight">{recommendation}</p>
                    <p className="text-[9px] text-blue-100 mt-1 italic uppercase">
                        Requires 100% calibration cycle completion before review.
                    </p>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 italic text-center">
                    This summary is descriptive only. It does not grant authority for system escalation.
                </p>
            </div>
        </div>
    );
}
