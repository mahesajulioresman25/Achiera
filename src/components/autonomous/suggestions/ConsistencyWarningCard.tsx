import React from 'react';

interface ConsistencyWarning {
    sku: string;
    conflicts: { id: string; action: string; date: string }[];
}

interface ConsistencyWarningCardProps {
    warnings: ConsistencyWarning[];
}

export function ConsistencyWarningCard({ warnings }: ConsistencyWarningCardProps) {
    if (warnings.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-red-200 text-red-700 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.047a1 1 0 00-1.6 0l-8.6 13a1 1 0 00.8 1.553h17.2a1 1 0 00.8-1.553l-8.6-13zM9 4a1 1 0 012 0v6a1 1 0 11-2 0V4zm1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <h4 className="text-[11px] font-black text-red-900 uppercase tracking-widest">Suggestion Consistency Variance</h4>
                </div>
                <span className="text-[9px] font-bold text-red-600 bg-white px-2 py-0.5 rounded border border-red-100 uppercase tracking-tight">Hard Block Phase 4</span>
            </div>

            <div className="space-y-6">
                {warnings.map((warning, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-red-100 overflow-hidden">
                        <div className="px-5 py-3 bg-red-50/50 border-b border-red-100">
                            <span className="text-[10px] font-black text-red-800 uppercase tracking-tight">SKU: {warning.sku}</span>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {warning.conflicts.map((c, j) => (
                                <div key={j} className={`p-4 rounded-xl border ${j === 0 ? 'bg-blue-50/20 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{j === 0 ? 'Latest' : 'Previous'}</span>
                                        <span className="text-[8px] font-bold text-gray-500">{c.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 font-medium leading-relaxed italic">"{c.action}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-[10px] text-red-700 font-bold italic leading-relaxed uppercase tracking-tighter">
                Conflict detected: The AI has provided inconsistent advice for the same entity within 14 days.
                Governance protocol dictates a mandatory extension of Phase 3 calibration.
            </p>
        </div>
    );
}
