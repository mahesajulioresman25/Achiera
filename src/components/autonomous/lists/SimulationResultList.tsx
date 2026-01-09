import React, { useState } from 'react';
import { RiskBadge } from '../ui/CoreComponents';
import { AgreementSamplingCard } from '../trust/AgreementSamplingCard';

interface SimulationResult {
    decisionId?: string; // Standardized field for calibration
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    confidenceScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    blockReason?: string;
    estimatedImpact: {
        type: string;
        amount: number;
    };
    safetyGateResults: Array<{
        gate: string;
        passed: boolean;
        message?: string;
    }>;
    aiExplanationPreview: string;
}

interface SimulationResultListProps {
    brandId: string;
    results: SimulationResult[];
}

export function SimulationResultList({ brandId, results }: SimulationResultListProps) {
    return (
        <div className="space-y-4">
            {results.map((result) => (
                <ResultItem key={result.ruleId} brandId={brandId} result={result} />
            ))}
        </div>
    );
}

function ResultItem({ brandId, result }: { brandId: string; result: SimulationResult }) {
    const [showExplanation, setShowExplanation] = useState(false);
    const [showCalibration, setShowCalibration] = useState(false);

    return (
        <div className={`bg-white border rounded-xl shadow-sm transition-all ${result.blockReason ? 'border-red-200' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-800">{result.ruleName}</h4>
                            <RiskBadge tier={result.riskLevel} size="sm" />
                        </div>
                        <div className="text-xs font-mono text-gray-400">{result.ruleId}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1">
                            Est. {result.estimatedImpact.type}
                        </div>
                        <div className="text-lg font-black text-green-600">
                            +IDR {result.estimatedImpact.amount.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Simulation Alert */}
                {result.blockReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
                        <div className="bg-red-500 text-white rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold text-red-700 uppercase">Execution Blocked: {result.blockReason}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safety Gate Checklist */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Safety Gate Checklist</span>
                        <div className="space-y-1.5">
                            {result.safetyGateResults.map((gate, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{gate.gate}</span>
                                    <div className="flex items-center gap-1.5">
                                        {gate.message && <span className="text-[10px] text-gray-400 italic">{gate.message}</span>}
                                        {gate.passed ? (
                                            <span className="text-green-500 font-bold">PASS</span>
                                        ) : (
                                            <span className="text-red-500 font-bold">FAIL</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Decision Confidence</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-gray-800">{(result.confidenceScore * 100).toFixed(0)}%</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                    className={`h-2 rounded-full ${result.confidenceScore >= 0.85 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${result.confidenceScore * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-[9px] text-gray-400 italic">Target Threshold: 85%</span>
                    </div>
                </div>

                {/* Trust Calibration Section (UPGRADED) */}
                <div className="mt-4">
                    <button
                        onClick={() => setShowCalibration(!showCalibration)}
                        className={`w-full py-2 px-4 rounded-lg flex justify-between items-center transition-all ${showCalibration ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'}`}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {showCalibration ? 'Hide Calibration Input' : '🚀 Calibrate Human Trust Alignment'}
                        </span>
                        {result.confidenceScore < 0.85 && !showCalibration && (
                            <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-0.5 rounded animate-pulse">ACTION REQUIRED</span>
                        )}
                    </button>

                    {showCalibration && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AgreementSamplingCard
                                decisionId={result.decisionId || result.ruleId}
                                brandId={brandId}
                            />
                        </div>
                    )}
                </div>

                {/* AI Explanation Advisory */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        {showExplanation ? '⯆' : '⯈'} AI ADVISORY EXPLANATION
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-300 uppercase">Observe Protocol Active</span>
                    </div>
                </div>

                {showExplanation && (
                    <div className="mt-2 p-3 bg-blue-50 bg-opacity-30 border-l-4 border-blue-400 text-sm text-gray-600 italic">
                        "{result.aiExplanationPreview}"
                        <div className="mt-2 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                            Advisory only. Final decision belongs to deterministic logic.
                        </div>
                    </div>
                )}
            </div>

            {/* Simulated Action Tag */}
            <div className="px-5 py-2 bg-yellow-50 rounded-b-xl border-t border-yellow-100 text-[10px] font-black text-yellow-700 flex justify-between items-center text-opacity-80">
                <span>INTENT: {result.blockReason ? 'BLOCK ' : 'SUGGEST '} [{result.ruleId}]</span>
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    SIMULATED - NO ACTION
                </span>
            </div>
        </div>
    );
}
