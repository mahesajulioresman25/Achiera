import React from 'react';
import { AutonomyVerdict } from '@/lib/autonomous-analytics/trust/verdict';

interface TrustVerdictPanelProps {
    verdict?: AutonomyVerdict;
    loading?: boolean;
}

export function TrustVerdictPanel({ verdict, loading }: TrustVerdictPanelProps) {
    if (loading) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center animate-pulse">
                <div className="h-8 w-48 bg-gray-100 rounded-lg mb-4"></div>
                <div className="h-4 w-32 bg-gray-50 rounded"></div>
            </div>
        );
    }

    if (!verdict) return null;

    const isReady = verdict.verdict === 'CONDITIONALLY_READY';
    const hasRedFlags = verdict.blocking_factors.length > 0;

    return (
        <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${isReady ? 'border-green-500 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
            {/* Background Watermark */}
            <div className="absolute top-0 right-0 p-8 rotate-12 opacity-5 pointer-events-none select-none">
                <span className={`text-6xl font-black uppercase tracking-tighter ${isReady ? 'text-green-600' : 'text-orange-600'}`}>
                    Governance Gate
                </span>
            </div>

            <div className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Autonomy Eligibility Verdict</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phase 2.9 Final Gate</span>
                        </div>
                        <h2 className={`text-4xl font-black tracking-tight ${isReady ? 'text-green-800' : 'text-orange-800'}`}>
                            {verdict.verdict === 'CONDITIONALLY_READY' ? 'ELIGIBILITY GRANTED' : 'ELIGIBILITY WITHHELD'}
                        </h2>
                        <p className="text-gray-500 mt-1 max-w-xl">
                            Deterministic analysis of sub-system stability, AI reliability, and human trust alignment.
                        </p>
                    </div>

                    <div className={`px-8 py-4 rounded-xl shadow-sm border-2 flex flex-col items-center ${isReady ? 'bg-green-600 border-green-700' : 'bg-orange-500 border-orange-600'}`}>
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Status</span>
                        <span className="text-xl font-black text-white uppercase tracking-wider">{verdict.verdict.replace('_', ' ')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <VerdictMetric label="Observation Days" value={`${verdict.observation_days}d`} sub="Min: 7d" status={verdict.observation_days >= 7 ? 'good' : 'warning'} />
                    <VerdictMetric label="System Stability" value={verdict.system_stability} sub="Success Rate" status={verdict.system_stability === 'STABLE' ? 'good' : 'danger'} />
                    <VerdictMetric label="AI Reliability" value={verdict.ai_reliability} sub="Drift Check" status={verdict.ai_reliability === 'CONSISTENT' ? 'good' : 'warning'} />
                    <VerdictMetric label="Human Alignment" value={verdict.human_alignment} sub="Subjective Delta" status={verdict.human_alignment === 'HIGH' ? 'good' : verdict.human_alignment === 'MEDIUM' ? 'warning' : 'danger'} />
                </div>

                {hasRedFlags && (
                    <div className="bg-white/80 border border-orange-200 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest">Blocking Factors Detected</h3>
                        </div>
                        <ul className="space-y-3">
                            {verdict.blocking_factors.map((factor, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <span className="h-2 w-2 rounded-full bg-orange-400 mt-1.5 shrink-0"></span>
                                    <span className="text-sm text-gray-700 italic">{factor}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-gray-100/50">
                    <div className="flex-grow">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Board Recommendation</div>
                        <div className={`text-lg font-black uppercase tracking-widest ${isReady ? 'text-green-700' : 'text-blue-600'}`}>
                            {verdict.recommendation.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 italic">Issued By Governance Controller</div>
                        <div className="text-xs font-mono text-gray-500">{new Date(verdict.issued_at).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Read-Only Interlock Footer */}
            <div className={`px-8 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-widest ${isReady ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>
                <span>Governance Lock: Read-Only Protocol Active</span>
                <span>Interlock State: Deterministic Evaluation Only</span>
            </div>
        </div>
    );
}

function VerdictMetric({ label, value, sub, status }: { label: string, value: string, sub: string, status: 'good' | 'warning' | 'danger' }) {
    const colorClass = status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-orange-500' : 'text-red-500';
    const bgClass = status === 'good' ? 'bg-green-50' : status === 'warning' ? 'bg-orange-50' : 'bg-red-50';

    return (
        <div className="bg-white/60 p-4 rounded-xl border border-gray-100/50 transition-all hover:shadow-md">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</span>
            <div className={`text-lg font-black tracking-tight ${colorClass}`}>{value}</div>
            <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-1 w-1 rounded-full ${colorClass.replace('text', 'bg')}`}></span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">{sub}</span>
            </div>
        </div>
    );
}
