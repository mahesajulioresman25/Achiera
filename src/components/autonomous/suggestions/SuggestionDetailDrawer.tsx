import React, { useState } from 'react';
import { Suggestion } from './SuggestionCard';

interface SuggestionDetailDrawerProps {
    suggestion: Suggestion | null;
    onClose: () => void;
    onFeedback: () => void;
}

export function SuggestionDetailDrawer({ suggestion, onClose, onFeedback }: SuggestionDetailDrawerProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!suggestion) return null;

    const handleFeedback = async (decision: 'ACCEPTED' | 'REJECTED' | 'DEFERRED') => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/autonomous-analytics/suggestions/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestionId: suggestion.id,
                    operatorId: 'BOARD_MEMBER_01',
                    decision,
                    reason: reason || undefined
                })
            });

            if (response.ok) {
                onFeedback();
                onClose();
            }
        } catch (error) {
            console.error('Record Feedback Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePromote = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/autonomous-analytics/assisted-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'PROMOTE',
                    suggestionId: suggestion.id
                })
            });

            if (response.ok) {
                onFeedback();
                onClose();
            }
        } catch (error) {
            console.error('Promotion Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#fafbfc]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Advisory Mode</span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {suggestion.id}</span>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Suggestion Analysis</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">✕</button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-8 py-8 space-y-8">
                    {/* Summary & Impact */}
                    <div className="bg-gray-900 rounded-2xl p-6 text-white">
                        <h3 className="text-lg font-bold mb-4">{suggestion.title}</h3>
                        <p className="text-sm text-gray-300 italic mb-6">"{suggestion.proposedAction}"</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Projected Shift</span>
                                <div className={`text-sm font-black ${suggestion.expectedImpact.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                                    {suggestion.expectedImpact.direction} {suggestion.expectedImpact.metric}
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">System Confidence</span>
                                <div className="text-sm font-black text-blue-400">
                                    {(suggestion.confidenceScore * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rationale Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Evidence & Rationale</h4>
                            <div className="h-px flex-grow bg-gray-100"></div>
                        </div>
                        <ul className="space-y-4">
                            {suggestion.rationale.map((item, idx) => (
                                <li key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-blue-600 font-bold text-xs mt-0.5">•</span>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {item}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Risk Disclosure */}
                    <div className={`p-6 rounded-2xl border ${suggestion.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`p-1 rounded ${suggestion.riskLevel === 'HIGH' ? 'bg-orange-200' : 'bg-blue-200'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <h4 className={`text-[11px] font-black uppercase tracking-widest ${suggestion.riskLevel === 'HIGH' ? 'text-orange-800' : 'text-blue-800'}`}>
                                Risk Disclosure: {suggestion.riskLevel} Tier
                            </h4>
                        </div>
                        {suggestion.riskLevel === 'HIGH' && (
                            <p className="text-xs text-orange-700 font-bold mb-4 animate-pulse">
                                ⚠️ ATTENTION: High-risk scenario detected. Detailed manual validation in external system is MANDATORY.
                            </p>
                        )}
                        <p className="text-xs text-gray-600 italic leading-relaxed">
                            This analysis is strictly advisory. The system does not possess execution authority. Any implementation of this suggestion must be performed manually by an authorized operator through external management consoles.
                        </p>
                    </div>

                    {/* Manual Steps Checklist */}
                    <div className="p-6 bg-[#fafbfc] rounded-2xl border border-gray-100">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Manual Action Protocol (Outside System)</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-3 w-3 border-2 border-blue-600 rounded"></div>
                                <p className="text-xs text-gray-500">Log in to primary management console (Ads Manager/ERP/Price Controller).</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-3 w-3 border-2 border-blue-600 rounded"></div>
                                <p className="text-xs text-gray-500">Search for SKU/Campaign: <span className="font-bold text-gray-700">{suggestion.title.split(' ').slice(-2).join(' ')}</span>.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-3 w-3 border-2 border-blue-600 rounded"></div>
                                <p className="text-xs text-gray-500">Apply the shift detailed in: <span className="italic">"{suggestion.proposedAction}"</span>.</p>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Form */}
                    <div className="pt-8 border-t border-gray-100">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Governor Review Feedback</h4>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Optional: Justification for decision..."
                            className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                        ></textarea>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-6 bg-white border-t border-gray-100 space-y-4">
                    <button
                        onClick={() => handleFeedback('ACCEPTED')}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Registering...' : 'Mark as Considered'}
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleFeedback('REJECTED')}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all disabled:opacity-50"
                        >
                            Reject Suggestion
                        </button>
                        <button
                            onClick={() => handleFeedback('DEFERRED')}
                            disabled={isSubmitting}
                            className="flex-1 py-4 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                        >
                            Defer
                        </button>
                        <button
                            onClick={handlePromote}
                            disabled={isSubmitting}
                            className="flex-1 py-4 bg-gray-900 border border-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-lg shadow-gray-200"
                        >
                            Promote to Action
                        </button>
                    </div>

                    {/* Professional Disclaimer */}
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">
                            Sistem ini memberikan saran berbasis data historis. Keputusan akhir sepenuhnya berada di tangan Anda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
