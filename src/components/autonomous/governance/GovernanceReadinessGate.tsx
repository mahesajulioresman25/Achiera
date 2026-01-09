import React from 'react';

interface ReadinessResponse {
    data: {
        simulationSummary: {
            totalSimulations: number;
            byFailureType: Record<string, number>;
            criticalFailures: number;
        };
        rollbackMetrics: {
            totalRollbacks: number;
            successfulRollbacks: number;
            avgLatencySeconds: number;
            RCS: number;
        };
    };
    decision: {
        decision: 'READY' | 'BLOCKED';
        blockReasons: string[];
        riskFlags: string[];
        cfoEscalationRequired: boolean;
        governanceStatement: string;
    };
}

export function GovernanceReadinessGate({ response, loading }: { response: ReadinessResponse | null, loading?: boolean }) {
    if (loading || !response) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-3xl border border-gray-100"></div>;
    }

    const { decision, data } = response;
    const isReady = decision.decision === 'READY';

    return (
        <div className={`rounded-3xl border-2 p-10 transition-all ${isReady ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight mb-1">Phase 4.5: Governance Readiness Gate</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                        Exit Evaluation for Assisted Mode Execution
                    </p>
                </div>
                <div className={`px-6 py-2 rounded-xl text-lg font-black uppercase tracking-widest ${isReady ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {decision.decision}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Evidence Column 1: Simulation Volume */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Evidence: Volume</span>
                    <div className="text-4xl font-black text-gray-800 mb-1">{data.simulationSummary.totalSimulations}</div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Total Simulations Run</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${data.simulationSummary.totalSimulations >= 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Target: 50+</span>
                    </div>
                </div>

                {/* Evidence Column 2: Rollback Score */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Evidence: Reliability</span>
                    <div className="text-4xl font-black text-gray-800 mb-1">{data.rollbackMetrics.RCS.toFixed(1)}%</div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Rollback Confidence Score</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${data.rollbackMetrics.RCS >= 98.5 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Red-Line: 98.5%</span>
                    </div>
                </div>

                {/* Evidence Column 3: Critical Failures */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Evidence: Safety</span>
                    <div className={`text-4xl font-black mb-1 ${data.simulationSummary.criticalFailures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {data.simulationSummary.criticalFailures}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Active Critical Failures</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${data.simulationSummary.criticalFailures === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Target: 0</span>
                    </div>
                </div>
            </div>

            {/* Decision Details */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="mb-6 pb-6 border-b border-gray-50">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Official Governance Statement</span>
                    <p className={`text-lg font-bold leading-relaxed italic ${isReady ? 'text-green-800' : 'text-red-800'}`}>
                        "{decision.governanceStatement}"
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Block Reasons */}
                    <div>
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-4">Critical Block Reasons</span>
                        {decision.blockReasons.length > 0 ? (
                            <ul className="space-y-3">
                                {decision.blockReasons.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                                        <span className="text-[10px] font-black text-red-700">⚠️</span>
                                        <span className="text-[10px] font-bold text-red-900">{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No active blocks</div>
                        )}
                    </div>

                    {/* Risk Flags & Escalation */}
                    <div>
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-4">Risk Flags & Escalation</span>
                        {decision.riskFlags.length > 0 || decision.cfoEscalationRequired ? (
                            <div className="space-y-4">
                                {decision.cfoEscalationRequired && (
                                    <div className="p-4 bg-orange-100 rounded-xl border border-orange-200">
                                        <span className="text-[10px] font-black text-orange-900 uppercase block mb-1">CFO Escalation Required</span>
                                        <p className="text-[10px] text-orange-800 leading-relaxed">
                                            Rollback Confidence is above floor (90%) but below Red-Line (98.5%). Mandatory CFO sign-off required.
                                        </p>
                                    </div>
                                )}
                                <ul className="space-y-2">
                                    {decision.riskFlags.map((flag, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-orange-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cleared: No risk flags</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-10 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
                    "Readiness is proven by evidence, not intent. AI does not trust. AI verifies."
                </p>
            </div>
        </div>
    );
}
