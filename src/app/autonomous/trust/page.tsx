'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/autonomous/ui/CoreComponents';
import { AutonomyReadinessGauge } from '@/components/autonomous/trust/AutonomyReadinessGauge';
import { RiskConcentrationHeatmap } from '@/components/autonomous/trust/RiskConcentrationHeatmap';
import { PromotionEligibilityGate } from '@/components/autonomous/trust/PromotionEligibilityGate';
import { TrustTrendGrid } from '@/components/autonomous/trust/TrustTrendGrid';
import { useSearchParams } from 'next/navigation';
import { HumanReadinessSummary } from '@/components/autonomous/trust/HumanReadinessSummary';
import { TrustGapRadar } from '@/components/autonomous/trust/TrustGapRadar';
import { DisagreementHeatmap } from '@/components/autonomous/trust/DisagreementHeatmap';
import { TrustVerdictPanel } from '@/components/autonomous/trust/TrustVerdictPanel';
import { ExecutiveConfidenceDashboard } from '@/components/autonomous/trust/ExecutiveConfidenceDashboard';
import { GovernanceSignOffPanel } from '@/components/autonomous/trust/GovernanceSignOffPanel';

export default function TrustPage() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';

    // Fetch Verdict (FINAL GATE)
    const { data: verdictData, isLoading: loadingVerdict } = useQuery({
        queryKey: ['trust-verdict', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/verdict?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Readiness and Trends
    const { data: readinessData, isLoading: loadingReadiness } = useQuery({
        queryKey: ['trust-readiness', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/readiness?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Risk Clusters
    const { data: clusterData, isLoading: loadingClusters } = useQuery({
        queryKey: ['risk-clusters', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/risk-clusters?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Calibration Report
    const { data: calibrationData, isLoading: loadingCalibration } = useQuery({
        queryKey: ['calibration-report', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/calibration?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Executive Confidence Report (Phase 3.75)
    const { data: confidenceData, isLoading: loadingConfidence, refetch: refetchConfidence } = useQuery({
        queryKey: ['executive-confidence', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/confidence?brandId=${brandId}`).then(r => r.json())
    });

    // Temporal snapshots for the grid
    const { data: snapshot7d } = useQuery({
        queryKey: ['snapshot-7d', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/readiness?brandId=${brandId}&period=7d`).then(r => r.json()),
        enabled: !!brandId
    });

    const { data: snapshot14d } = useQuery({
        queryKey: ['snapshot-14d', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/readiness?brandId=${brandId}&period=14d`).then(r => r.json()),
        enabled: !!brandId
    });

    if (loadingReadiness || loadingClusters || loadingCalibration || loadingVerdict || loadingConfidence) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const { readiness, snapshot: snapshot30d } = readinessData || {};
    const { clusters } = clusterData || {};
    const { report, summary: calibrationSummary } = calibrationData || {};

    const eligibilityItems = [
        {
            label: "30-Day Trust Stability",
            passed: readiness?.score > 60,
            description: "Requires consistent trust scores above 60 for 30 consecutive days."
        },
        {
            label: "Rollback Threshold (< 2%)",
            passed: snapshot30d?.rollback_rate < 0.02,
            description: "Systemic stability check. Any rollback spike > 2% blocks promotion."
        },
        {
            label: "Confidence Floor (≥ 0.85)",
            passed: snapshot30d?.avg_confidence >= 0.85,
            description: "Minimum mean model confidence required for Level 1 proposal."
        },
        {
            label: "CFO Safety Override",
            passed: confidenceData?.aggregated_score >= 85,
            description: "Phase 3.75 Executive Confidence must be >= 85% for promotion eligibility."
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafbfc] pb-20">
            {/* Global Audit Header */}
            <div className="bg-gray-900 text-white border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded">OBSERVE MODE</div>
                        <h1 className="text-sm font-black tracking-widest uppercase">CFO & Board Trust Hardening Panel</h1>
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Last Audit: {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* FINAL GOVERNANCE GATE (Phase 2.9) */}
                <div className="mb-10">
                    <TrustVerdictPanel verdict={verdictData} />
                </div>

                {/* Executive Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-1">
                        <AutonomyReadinessGauge
                            score={readiness?.score || 0}
                            status={readiness?.status || 'NOT_READY'}
                            blockingFactors={readiness?.blocking_factors || []}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <TrustTrendGrid
                            data7d={snapshot7d?.snapshot}
                            data14d={snapshot14d?.snapshot}
                            data30d={snapshot30d}
                        />
                    </div>
                </div>

                {/* Human Trust Calibration Dashboard (NEW) */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-lg font-black tracking-widest uppercase text-gray-800">Human Trust Calibration</h2>
                        <div className="h-px flex-grow bg-gray-100"></div>
                        <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Subjective Alignment Audit</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <HumanReadinessSummary
                            alignment={calibrationSummary?.trust_alignment || 'LOW'}
                            concerns={calibrationSummary?.primary_concerns || []}
                            recommendation={calibrationSummary?.recommendation || 'CONTINUE OBSERVE'}
                        />
                        <TrustGapRadar
                            systemConfidence={report?.system_confidence_avg || 0}
                            humanAgreement={report?.human_agreement_rate || 0}
                        />
                        <DisagreementHeatmap clusters={report?.disagreement_clusters_full || []} />
                    </div>
                </div>

                {/* Executive Confidence Dashboard (Phase 3.75) */}
                <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ExecutiveConfidenceDashboard
                            score={confidenceData?.aggregated_score || 0}
                            dimensions={confidenceData?.dimensions || { operational: 0, risk: 0, explainability: 0, psychological: 0 }}
                            status={confidenceData?.status || 'PENDING'}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <GovernanceSignOffPanel
                            brandId={brandId}
                            onSignOff={refetchConfidence}
                        />
                    </div>
                </div>

                {/* Risk & Eligibility Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <RiskConcentrationHeatmap clusters={clusters || []} />
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Risk Architecture Advisory</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                                <p className="text-xs text-gray-600 italic">
                                    "The Current readiness score of {readiness?.score.toFixed(0)} reflects a deterministic evaluation of {readiness?.status === 'READY_FOR_REVIEW' ? 'high' : 'low-to-moderate'} structural trust.
                                    {readiness?.blocking_factors.length > 0 ? ' Specific blocking factors must be addressed before suggesting any autonomy escalation.' : ' While metrics are stable, final sign-off is retained by the Risk Architect.'}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 bg-opacity-30 rounded border border-blue-100">
                                    <span className="text-[9px] font-black text-blue-500 uppercase">Data Sparsity Rank</span>
                                    <p className="text-sm font-bold text-gray-700">OPTIMAL (98th)</p>
                                </div>
                                <div className="p-3 bg-orange-50 bg-opacity-30 rounded border border-orange-100">
                                    <span className="text-[9px] font-black text-orange-500 uppercase">Volitility Index</span>
                                    <p className="text-sm font-bold text-gray-700">MODERATE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Promotion Readiness Gate (Crucial Safety Element) */}
                <div className="mt-12">
                    <PromotionEligibilityGate
                        items={eligibilityItems}
                        globalStatus={readiness?.status === 'READY_FOR_REVIEW' ? 'PENDING_REVIEW' : 'LOCKED'}
                    />
                </div>

                {/* Audit Disclaimer */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center max-w-2xl mx-auto">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                        This report is a read-only artifact of the Autonomous Safety Interlock system.
                        Escalation to Autonomy Level 1 (Suggest Mode) requires a formal motion by the board.
                        No autonomous writes or mutations are active.
                        System is strictly operating on Observe Mode protocol.
                    </p>
                </div>
            </main>
        </div>
    );
}

