import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Suggestion, SuggestionCard } from './SuggestionCard';
import { SuggestionDetailDrawer } from './SuggestionDetailDrawer';

interface SuggestionInboxProps {
    brandId: string;
    onActionPromoted?: () => void;
}

export function SuggestionInbox({ brandId, onActionPromoted }: SuggestionInboxProps) {
    const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
    const queryClient = useQueryClient();

    const { data: suggestionData, isLoading: loadingSuggestions, refetch } = useQuery({
        queryKey: ['suggestions', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/suggestions?brandId=${brandId}`).then(r => r.json())
    });

    const { data: verdictData, isLoading: loadingVerdict } = useQuery({
        queryKey: ['trust-verdict', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/verdict?brandId=${brandId}`).then(r => r.json())
    });

    const suggestions = suggestionData?.suggestions || [];
    const isLocked = verdictData?.verdict !== 'CONDITIONALLY_READY' || verdictData?.observation_days < 30;

    const handleFeedback = () => {
        queryClient.invalidateQueries({ queryKey: ['suggestions', brandId] });
        refetch();
        if (onActionPromoted) onActionPromoted();
    };

    if (loadingSuggestions || loadingVerdict) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100"></div>
                ))}
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-2">Suggestion Mode Locked</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                    Suggest Mode requires a minimum of 30 observation days and a "CONDITIONALLY_READY" governance verdict.
                    Current progress: <span className="font-bold text-blue-600">{verdictData?.observation_days} / 30 days</span>.
                </p>

                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center gap-8">
                    <div className="text-center">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Status</span>
                        <span className="text-xs font-bold text-gray-500 uppercase">{verdictData?.verdict.replace('_', ' ') || 'LOCKED'}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Safety Gate</span>
                        <span className="text-xs font-bold text-gray-500 uppercase">Interlocked</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Global Advisory Banner */}
            <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-black text-green-800 uppercase tracking-widest">
                        Suggest Mode — Human Action Required Outside System
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => <div key={i} className="h-5 w-5 rounded-full border-2 border-green-50 bg-green-100 flex items-center justify-center text-[8px] font-bold text-green-600">G{i}</div>)}
                    </div>
                    <span className="text-[10px] font-bold text-green-600 uppercase">Governance v3.0 Active</span>
                </div>
            </div>

            {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
                    <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">Heuristic Engine Analyzing...</h4>
                    <p className="text-xs text-gray-400 font-medium">No actionable advisory drafts present for this segment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {suggestions.map((s: any) => (
                        <SuggestionCard
                            key={s.id}
                            suggestion={{
                                id: s.id,
                                brandId: s.brandId,
                                domain: s.domain,
                                title: s.title,
                                proposedAction: s.proposedAction,
                                rationale: s.rationale,
                                expectedImpact: s.expectedImpact,
                                confidenceScore: s.confidenceScore,
                                riskLevel: s.riskLevel,
                                phaseGate: s.phaseGate,
                                createdAt: s.createdAt
                            }}
                            onClick={(item) => setSelectedSuggestion(item)}
                        />
                    ))}
                </div>
            )}

            <SuggestionDetailDrawer
                suggestion={selectedSuggestion}
                onClose={() => setSelectedSuggestion(null)}
                onFeedback={handleFeedback}
            />
        </div>
    );
}
