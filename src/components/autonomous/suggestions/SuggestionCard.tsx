import React from 'react';

export interface Suggestion {
    id: string;
    brandId: string;
    domain: string;
    title: string;
    proposedAction: string;
    rationale: string[];
    expectedImpact: {
        metric: string;
        direction: 'UP' | 'DOWN';
        confidence: number;
    };
    confidenceScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    phaseGate: string;
    createdAt: string;
}

interface SuggestionCardProps {
    suggestion: Suggestion;
    onClick: (suggestion: Suggestion) => void;
}

export function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
    const isHighRisk = suggestion.riskLevel === 'HIGH';
    const isLowConfidence = suggestion.confidenceScore < 0.8;

    return (
        <div
            onClick={() => onClick(suggestion)}
            className={`group bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${isHighRisk ? 'border-orange-100 hover:border-orange-300' : 'border-gray-50 hover:border-blue-200'
                }`}
        >
            {/* Safety Label */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-widest uppercase">
                        {suggestion.domain}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-200"></span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isHighRisk ? 'text-orange-600' : 'text-gray-400'}`}>
                        {suggestion.riskLevel} Risk
                    </span>
                </div>
                {isLowConfidence && (
                    <span className="px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black uppercase italic rounded tracking-tighter">
                        Low Confidence
                    </span>
                )}
            </div>

            <h3 className="text-lg font-black text-gray-800 leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                {suggestion.title}
            </h3>

            <p className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl italic font-medium leading-relaxed">
                "{suggestion.proposedAction}"
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 border-t border-gray-50 pt-6">
                <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Expected Impact</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-black ${suggestion.expectedImpact.direction === 'UP' ? 'text-green-600' : 'text-red-500'}`}>
                            {suggestion.expectedImpact.direction === 'UP' ? '▲' : '▼'} {suggestion.expectedImpact.metric}
                        </span>
                    </div>
                </div>
                <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">AI Confidence</span>
                    <div className="text-sm font-black text-gray-700">
                        {(suggestion.confidenceScore * 100).toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Formal Adhesive Info */}
            <div className="flex justify-between items-center py-3 px-4 bg-gray-900 rounded-xl">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    AI SUGGESTION — NOT EXECUTED
                </span>
                <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-blue-100"></div>
                    <div className="h-1 w-1 rounded-full bg-blue-300"></div>
                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                </div>
            </div>
        </div>
    );
}
