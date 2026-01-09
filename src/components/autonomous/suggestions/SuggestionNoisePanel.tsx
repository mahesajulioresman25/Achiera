import React from 'react';

interface NoiseAlert {
    domain: string;
    count: number;
    risk: 'LOW' | 'HIGH';
}

interface SuggestionNoisePanelProps {
    alerts: NoiseAlert[];
}

export function SuggestionNoisePanel({ alerts }: SuggestionNoisePanelProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-orange-200 text-orange-700 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">AI Output Saturation Risk</h4>
                </div>
                <span className="text-[9px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-100 uppercase tracking-tight">Human Friction Detected</span>
            </div>

            <div className="space-y-4">
                {alerts.map((alert, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-orange-100">
                        <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saturation Domain</span>
                            <span className="text-sm font-black text-gray-800">{alert.domain}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-1">Volume (7d)</span>
                            <span className="text-sm font-black text-orange-700">{alert.count} Suggestions</span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-[10px] text-orange-700 font-medium italic leading-relaxed">
                High suggestion frequency in a single domain can lead to operator fatigue and decision blindness.
                Consider manual review of suggestion frequency thresholds.
            </p>
        </div>
    );
}
