import React, { useState } from 'react';

export interface StagedAction {
    id: string;
    suggestionId: string;
    status: 'STAGED' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REVERTING' | 'REVERTED';
    payload: any;
    riskTier: string;
    reversalPlan: any;
    suggestion?: {
        title: string;
    };
    approvals: any[];
}

export function ActionStagingArea({ brandId, actions, onRefresh }: { brandId: string; actions: StagedAction[]; onRefresh: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState<Record<string, boolean>>({});

    const handleAction = async (actionId: string, type: 'FINALIZE' | 'APPROVE' | 'EXECUTE' | 'REVERT') => {
        setIsSubmitting(actionId);
        try {
            const payload: any = { action: type, actionId };

            if (type === 'APPROVE') {
                payload.operatorId = 'OPERATOR_01'; // Mock
                payload.role = 'CFO'; // Mock
                payload.acknowledgment = "I have verified the risk of this action.";
            } else if (type === 'FINALIZE') {
                // Just finalizing the current payload for simplicity in this component
                payload.payload = actions.find(a => a.id === actionId)?.payload;
            }

            const response = await fetch('/api/autonomous-analytics/assisted-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onRefresh();
            }
        } catch (err) {
            console.error(`Action ${type} failed:`, err);
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-sm font-black tracking-[0.3em] uppercase text-gray-400">Action Staging Area</h2>
                <div className="h-px flex-grow bg-gray-100"></div>
                <div className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-sm">
                    HUMAN-LOCKED CONDUIT
                </div>
            </div>

            {actions.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-16 text-center">
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No actions currently staged</p>
                    <p className="text-[10px] text-gray-400 mt-2 lowercase">promote a suggestion to start the execution workflow</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {actions.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.status === 'STAGED' ? 'bg-gray-100 text-gray-500' :
                                                    item.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                        'bg-blue-100 text-blue-600'
                                                }`}>
                                                {item.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-800 tracking-tight">{item.suggestion?.title || 'Unknown Action'}</h3>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${item.riskTier === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {item.riskTier} RISK
                                    </div>
                                </div>

                                {/* State-specific Controls */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                    {/* Step 1: Definition */}
                                    <div className={`p-6 rounded-2xl border ${item.status === 'STAGED' ? 'bg-gray-50 border-gray-200' : 'bg-white opacity-50 border-gray-100'}`}>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">1. Staging</span>
                                        <p className="text-[10px] text-gray-500 leading-relaxed mb-4 font-bold uppercase italic">"Verify action parameters and payload integrity."</p>
                                        <button
                                            disabled={item.status !== 'STAGED' || isSubmitting === item.id}
                                            onClick={() => handleAction(item.id, 'FINALIZE')}
                                            className="w-full py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-30"
                                        >
                                            Finalize Definition
                                        </button>
                                    </div>

                                    {/* Step 2: Approval */}
                                    <div className={`p-6 rounded-2xl border ${item.status === 'PENDING_APPROVAL' ? 'bg-blue-50 border-blue-200' : (item.status === 'APPROVED' || item.status === 'EXECUTING' || item.status === 'COMPLETED') ? 'bg-green-50/30 border-green-100' : 'bg-white opacity-50 border-gray-100'}`}>
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-4">2. Governance</span>
                                        <div className="space-y-2 mb-4">
                                            {item.approvals.length > 0 ? item.approvals.map((a: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                    {a.role} SIGNED
                                                </div>
                                            )) : <div className="text-[10px] text-gray-400 italic">Awaiting Signatures...</div>}
                                        </div>
                                        <button
                                            disabled={item.status !== 'PENDING_APPROVAL' || isSubmitting === item.id}
                                            onClick={() => handleAction(item.id, 'APPROVE')}
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-30 shadow-lg shadow-blue-200"
                                        >
                                            Sign as CFO
                                        </button>
                                    </div>

                                    {/* Step 3: Execution */}
                                    <div className={`lg:col-span-2 p-6 rounded-2xl border ${item.status === 'APPROVED' ? 'bg-orange-50 border-orange-200 shadow-inner' : 'bg-white opacity-50 border-gray-100'}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">3. Manual Trigger</span>
                                            {item.status === 'APPROVED' && (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`terms-${item.id}`}
                                                        checked={!!acceptedTerms[item.id]}
                                                        onChange={(e) => setAcceptedTerms(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                        className="h-4 w-4 border-2 border-orange-300 rounded focus:ring-orange-500"
                                                    />
                                                    <label htmlFor={`terms-${item.id}`} className="text-[9px] font-black text-orange-800 uppercase tracking-tighter cursor-pointer">
                                                        I accept full responsibility
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            disabled={item.status !== 'APPROVED' || !acceptedTerms[item.id] || isSubmitting === item.id}
                                            onClick={() => handleAction(item.id, 'EXECUTE')}
                                            className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${item.status === 'APPROVED' && acceptedTerms[item.id]
                                                    ? 'bg-gray-900 text-white border-2 border-gray-900 hover:bg-black scale-[1.02]'
                                                    : 'bg-gray-50 text-gray-300 border-2 border-gray-100'
                                                } disabled:opacity-30 disabled:scale-100`}
                                        >
                                            {item.status === 'EXECUTING' ? 'Propagating Signals...' :
                                                item.status === 'COMPLETED' ? '✓ Execution Verified' :
                                                    'Execute Manual Shift'}
                                        </button>

                                        {item.status === 'COMPLETED' && (
                                            <button
                                                onClick={() => handleAction(item.id, 'REVERT')}
                                                className="mt-4 w-full py-2 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all"
                                            >
                                                Trigger Emergency Rollback
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Immutable Audit Line */}
                            <div className="px-8 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Responsibility Locked</span>
                                <span className="text-[8px] font-mono text-gray-400 uppercase tracking-tighter">PHASE 4.0 PROTOCOL</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
