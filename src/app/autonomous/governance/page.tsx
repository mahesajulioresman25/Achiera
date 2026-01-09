'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/autonomous/ui/CoreComponents';
import { AssistedFailureLab } from '@/components/autonomous/simulations/AssistedFailureLab';
import { GovernanceReadinessGate } from '@/components/autonomous/governance/GovernanceReadinessGate';

export default function GovernancePage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';

    // Fetch Assisted Action to simulate (just get the latest one for the lab)
    const { data: actionsData, isLoading: loadingActions } = useQuery({
        queryKey: ['assisted-actions', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/assisted-actions?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Readiness Gate Evaluation
    const { data: gateData, isLoading: loadingGate, refetch: refetchGate } = useQuery({
        queryKey: ['governance-gate', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/governance/readiness-gate?brandId=${brandId}`).then(r => r.json())
    });

    if (loadingActions || loadingGate) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const latestAction = actionsData?.actions?.[0];

    return (
        <div className="min-h-screen bg-[#fafbfc] pb-20">
            {/* Governance Header */}
            <div className="bg-red-900 text-white border-b border-red-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-white text-red-900 text-[10px] font-black px-2 py-0.5 rounded">PHASE 4.5</div>
                        <h1 className="text-sm font-black tracking-widest uppercase italic">Assisted Execution Readiness Lab</h1>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
                {/* 1. The Readiness Gate (Final Verdict) */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-sm font-black tracking-[0.3em] uppercase text-gray-400">Governance Clearance</h2>
                        <div className="h-px flex-grow bg-gray-100"></div>
                    </div>
                    <GovernanceReadinessGate response={gateData} />
                </section>

                {/* 2. Failure Simulation Lab */}
                <section>
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-black tracking-[0.3em] uppercase text-gray-400">Failure Stress-Testing</h2>
                            <div className="h-px w-32 bg-gray-100"></div>
                        </div>
                        <button
                            onClick={() => refetchGate()}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                        >
                            Refresh Metrics
                        </button>
                    </div>

                    {latestAction ? (
                        <AssistedFailureLab
                            brandId={brandId}
                            actionId={latestAction.id}
                        />
                    ) : (
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
                            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                                No Assisted Action Template Found for Simulation.
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">
                                Please promote a suggestion to "Staged Action" first.
                            </p>
                        </div>
                    )}
                </section>

                {/* Audit Disclaimer */}
                <div className="pt-10 border-t border-gray-100 text-center max-w-2xl mx-auto">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                        "Readiness is proven by evidence, not intent."
                        This lab models human failure and verified rollback reliability.
                        No production execution is active. System is in Shadow-Simulation mode only.
                    </p>
                </div>
            </main>
        </div>
    );
}
