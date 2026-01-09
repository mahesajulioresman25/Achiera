import React, { useState } from 'react';

interface FailureScenario {
    id: string;
    label: string;
    description: string;
}

const TAXONOMY: FailureScenario[] = [
    { id: 'INCORRECT_PAYLOAD', label: 'Incorrect Payload', description: 'Simulates operator misconfiguration or typos in action parameters.' },
    { id: 'INCORRECT_TIMING', label: 'Incorrect Timing', description: 'Simulates approval of stale suggestions or during volatile events.' },
    { id: 'OVERCONFIDENCE_BIAS', label: 'Overconfidence Bias', description: 'Simulates skipping manual validation steps.' },
    { id: 'ROLLBACK_FAILURE', label: 'Rollback Failure', description: 'Simulates a critical failure in the reversal protocol.' },
    { id: 'APPROVAL_CHAIN_BREAKDOWN', label: 'Approval Chain Breakdown', description: 'Simulates rushed or bypassed governance signatures.' },
    { id: 'HUMAN_PANIC_RESPONSE', label: 'Human Panic Response', description: 'Simulates oscillation caused by rapid manual overrides.' },
];

export function AssistedFailureLab({ brandId, actionId }: { brandId: string; actionId: string }) {
    const [selectedScenario, setSelectedScenario] = useState(TAXONOMY[0].id);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/autonomous-analytics/simulations/failure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    assistedActionId: actionId,
                    failureScenario: selectedScenario,
                    parameters: { stressLevel: 'NORMAL' }
                })
            });
            const data = await res.json();
            setReport(data);
        } catch (err) {
            console.error('Simulation Failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden bg-gray-50 border-2 border-dashed border-red-200 rounded-3xl p-8">
            {/* Mandatory Safety Watermark */}
            <div className="absolute top-0 right-0 p-4 transform rotate-12 opacity-10 pointer-events-none">
                <span className="text-6xl font-black text-red-600 uppercase tracking-tighter">SIMULATION ONLY</span>
            </div>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1">Assisted Failure Lab</h3>
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-loose">
                        Phase 4.25: Stress-Testing Human Error & Rollback Reliability
                    </p>
                </div>
                <div className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg shadow-red-900/20">
                    READ-ONLY MODE
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Control Panel */}
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Select Failure Scenario</label>
                        <select
                            value={selectedScenario}
                            onChange={(e) => setSelectedScenario(e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        >
                            {TAXONOMY.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed italic pr-10">
                        {TAXONOMY.find(s => s.id === selectedScenario)?.description}
                    </p>

                    <button
                        onClick={runSimulation}
                        disabled={loading}
                        className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all disabled:opacity-50"
                    >
                        {loading ? 'Propagating Shadow State...' : 'Trigger Simulation'}
                    </button>

                    <p className="text-[9px] text-gray-400 text-center uppercase tracking-tighter font-bold">
                        "This button does not execute real actions."
                    </p>
                </div>

                {/* Outcome Display */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    {report ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Simulation Result</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${report.rollbackSuccess ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                    {report.rollbackSuccess ? 'Rollback Verified' : 'Rollback Failed'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                                    <span className="text-[8px] font-black text-red-600 uppercase block mb-1">Financial Loss</span>
                                    <div className="text-lg font-black text-red-700">Rp {Math.abs(report.simulatedImpact.financial).toLocaleString()}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Rollback Latency</span>
                                    <div className="text-lg font-black text-gray-800">{report.rollbackLatency}s</div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3">Governance Breaches</span>
                                <div className="space-y-2">
                                    {report.governanceBreachFlags.length > 0 ? report.governanceBreachFlags.map((flag: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                            <span className="text-[10px] font-bold text-orange-800 uppercase">{flag.replace(/_/g, ' ')}</span>
                                        </div>
                                    )) : (
                                        <div className="text-[10px] text-gray-400 italic">No structural breaches detected.</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <span className="text-[9px] font-black text-gray-300 uppercase block mb-1">Repro Hash</span>
                                <code className="text-[8px] text-gray-400 break-all bg-gray-50 p-2 rounded block">{report.reproducibilityHash}</code>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">No active simulation report</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                    "SIMULATION — NO ACTION TAKEN. This dashboard provides theoretical failure modeling for governance hardening."
                </p>
            </div>
        </div>
    );
}
