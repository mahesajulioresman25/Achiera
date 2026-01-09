import React, { useState } from 'react';
import { LoadingSpinner, RiskBadge } from '../ui/CoreComponents';
import { SimulationResultList } from '../lists/SimulationResultList';

interface SimulationPanelProps {
    brandId: string;
}

export function SimulationPanel({ brandId }: SimulationPanelProps) {
    const [simulateMode, setSimulateMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<any[]>([]);
    const [domain, setDomain] = useState<string>('ALL');

    const runSimulation = async () => {
        setLoading(true);
        setResults([]);

        try {
            const response = await fetch('/api/autonomous-analytics/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    domain: domain === 'ALL' ? undefined : domain
                })
            });

            if (!response.ok) throw new Error('Simulation failed');

            const data = await response.json();

            // Map DecisionResult to our UI display format
            const mappedResults = data.results.map((r: any) => ({
                ruleId: r.ruleId,
                ruleName: r.ruleName,
                triggered: r.triggered,
                confidenceScore: r.confidenceScore,
                riskLevel: r.riskLevel,
                blockReason: r.blockReason,
                estimatedImpact: r.estimatedImpact,
                safetyGateResults: r.safetyGateResults,
                aiExplanationPreview: r.explanation || "AI Evaluation completed based on deterministic rule sets."
            }));

            setResults(mappedResults);
            setSimulateMode(true);
        } catch (error) {
            console.error('Simulation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute top-4 right-4 rotate-12 opacity-10 pointer-events-none select-none">
                <span className="text-4xl font-black text-blue-600 border-4 border-blue-600 p-2">SIMULATION MODE</span>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Simulation Center (The Safe Lab)</h2>
                        <p className="text-sm text-gray-500">Run safe, read-only scenarios to validate rule logic without affecting production.</p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            <option value="ALL">All Domains</option>
                            <option value="SALES">Sales Optimization</option>
                            <option value="INVENTORY">Inventory Management</option>
                            <option value="ADS">Ad Spend Control</option>
                        </select>

                        <button
                            onClick={runSimulation}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : 'Run Simulation'}
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 animate-pulse">AI Simulation in progress... evaluating safety gates...</p>
                    </div>
                )}

                {simulateMode && !loading && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">Found {results.filter(r => r.triggered).length} potential outcomes for brand: <strong>{brandId}</strong></span>
                            <span className="text-xs font-bold text-blue-600 uppercase">Snapshot: Read-Only Simulation</span>
                        </div>

                        <SimulationResultList brandId={brandId} results={results} />
                    </div>
                )}

                {!simulateMode && !loading && (
                    <div className="py-12 text-center">
                        <div className="bg-white inline-flex p-4 rounded-full shadow-sm mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.642.386a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 01-2.828 0l-.168-.168a2 2 0 010-2.828l1.168-1.168a2 2 0 00.547-1.022l.477-2.387a6 6 0 01.517-3.86l.386-.642a6 6 0 00.517-3.86l-.477-2.387a2 2 0 00-.547-1.022l-1.168-1.168a2 2 0 010-2.828l.168-.168a2 2 0 012.828 0l1.168 1.168a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.642-.386a6 6 0 013.86-.517l2.387.477a2 2 0 001.022-.547l1.168-1.168a2 2 0 012.828 0l.168.168a2 2 0 010 2.828l-1.168 1.168a2 2 0 00-.547 1.022l-.477 2.387a6 6 0 00-.517 3.86l-.386.642a6 6 0 01-.517 3.86l.477 2.387a2 2 0 00.547 1.022l1.168 1.168a2 2 0 010 2.828l-.168.168a2 2 0 01-2.828 0l-1.168-1.168z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-600 font-medium">Ready for Stress Test</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto">Click "Run Simulation" to see how current rules would respond to latest market conditions.</p>
                    </div>
                )}
            </div>

            {/* CFO Safety Interlock Footer */}
            <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <span>Safe Lab Context: Read-Only (Determinism: 1.0)</span>
                <span>NO DB WRITES PERMITTED</span>
            </div>
        </div>
    );
}
