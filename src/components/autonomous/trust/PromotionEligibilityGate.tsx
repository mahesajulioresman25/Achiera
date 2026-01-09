import React from 'react';

interface EligibilityItem {
    label: string;
    passed: boolean;
    description: string;
}

interface PromotionEligibilityGateProps {
    items: EligibilityItem[];
    globalStatus: 'LOCKED' | 'PENDING_REVIEW' | 'PAUSED';
}

export function PromotionEligibilityGate({ items, globalStatus }: PromotionEligibilityGateProps) {
    return (
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden border border-gray-800">
            {/* Background Texture/Watermark */}
            <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
                <span className="text-8xl font-black rotate-12 block">LOCKED</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-black tracking-widest text-blue-400 uppercase">Promotion Readiness Gate</h3>
                    <p className="text-xs text-gray-400 mt-1">Audit-first checklist for Autonomy Level 1 (Suggest Mode)</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-black tracking-widest uppercase">System Status: {globalStatus}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {items.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex gap-4 items-start ${item.passed ? 'bg-green-500 bg-opacity-5 border-green-500 border-opacity-20' : 'bg-red-500 bg-opacity-5 border-red-500 border-opacity-20'}`}>
                        <div className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${item.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {item.passed ? '✓' : '✕'}
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${item.passed ? 'text-green-400' : 'text-red-400'}`}>{item.label}</p>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-4 text-orange-400 mb-2">
                    <span className="text-xl font-black">⚠</span>
                    <span className="text-xs font-black uppercase tracking-widest">Hard Safety Interlock</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Eligibility for Level 1 (Suggest Mode) requires 30 days of consecutive trust stability. Current performance allows for continued OBSERVATION only. Promotion triggers have been physically removed from this interface to prevent accidental escalation.
                </p>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-auto px-6 py-3 bg-gray-700 rounded-lg text-gray-500 text-[10px] font-black uppercase tracking-widest text-center cursor-not-allowed">
                        Promotion Controls Disabled
                    </div>
                    <span className="text-[10px] text-gray-500 italic">This system is NOT yet authorized to advance autonomy level. Manual Board Review required.</span>
                </div>
            </div>

            {/* Footer Sign-off (Visual Only) */}
            <div className="mt-8 flex justify-between items-center text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                <span>Risk Architecture v4.2.0</span>
                <span>Interlock-256-Strict</span>
                <span>Deterministic Mode Active</span>
            </div>
        </div>
    );
}
