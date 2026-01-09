// Overview Page - Executive Dashboard
// Main landing page for autonomous analytics

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetricCard, LoadingSpinner } from '@/components/autonomous/ui/CoreComponents';
import { AutonomyLevelIndicator } from '@/components/autonomous/controls/AutonomyLevelIndicator';
import { SimulationPanel } from '@/components/autonomous/panels/SimulationPanel';
import { DecisionAuditTable } from '@/components/autonomous/tables/DecisionAuditTable';
import { SuggestionInbox } from '@/components/autonomous/suggestions/SuggestionInbox';
import { SuggestionQualityDashboard } from '@/components/autonomous/suggestions/SuggestionQualityDashboard';
import { SuggestionNoisePanel } from '@/components/autonomous/suggestions/SuggestionNoisePanel';
import { ConsistencyWarningCard } from '@/components/autonomous/suggestions/ConsistencyWarningCard';
import { ActionStagingArea } from '@/components/autonomous/actions/ActionStagingArea';
import { useSearchParams } from 'next/navigation';
import { getAutonomousBrandAction } from '@/lib/actions/rasa-ibu/businessIntelligence';

export default function OverviewPage() {
    return (
        <React.Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <OverviewContent />
        </React.Suspense>
    );
}

function OverviewContent() {
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';

    // Fetch Brand Info
    const { data: brandRes } = useQuery({
        queryKey: ['brand-info', brandId],
        queryFn: () => getAutonomousBrandAction(brandId),
        enabled: !!brandId
    });

    const brandName = (brandRes as any)?.data?.name || (brandId === 'test_brand_001' ? 'Frozen Harvest Co.' : brandId);
    const brandPilot = brandId === 'rasa-ibu' ? 'Pilot: Authentic Indonesian Cuisine' : 'Pilot: Digital Operations';

    // Fetch trust metrics
    const { data: trustMetrics, isLoading: loadingTrust } = useQuery({
        queryKey: ['trust-metrics', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/trust/metrics?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch budget consumption
    const { data: budgetData, isLoading: loadingBudget } = useQuery({
        queryKey: ['budget', brandId, 'daily'],
        queryFn: () => fetch(`/api/autonomous-analytics/budget/consumption?brandId=${brandId}&period=daily`).then(r => r.json())
    });

    // Fetch active rules count
    const { data: rulesData, isLoading: loadingRules } = useQuery({
        queryKey: ['rules', brandId, 'summary'],
        queryFn: () => fetch(`/api/autonomous-analytics/rules/summary?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch recent executions/history
    const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ['executions', brandId, 'recent'],
        queryFn: () => fetch(`/api/autonomous-analytics/executions/recent?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Suggestion Quality Audit (Phase 3.5)
    const { data: qualityData, isLoading: loadingQuality } = useQuery({
        queryKey: ['suggestion-quality', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/suggestions/quality-audit?brandId=${brandId}`).then(r => r.json())
    });

    // Fetch Assisted Actions (Phase 4.0)
    const { data: actionsData, isLoading: loadingActions, refetch: refetchActions } = useQuery({
        queryKey: ['assisted-actions', brandId],
        queryFn: () => fetch(`/api/autonomous-analytics/assisted-actions?brandId=${brandId}`).then(r => r.json())
    });

    if (loadingTrust || loadingRules || loadingHistory || loadingQuality || loadingActions) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Spec-specific KPI Mapping
    const ruleAcceptance = trustMetrics?.rule_acceptance_rate * 100 || 0;
    const aiAgreement = trustMetrics?.ai_agreement_rate * 100 || 0;
    const rollbackRate = trustMetrics?.rollback_frequency * 100 || 0;

    const currentAutonomyLevel = rulesData?.byLevel?.reduce((prev: any, curr: any) =>
        curr.count > 0 ? Math.max(prev, curr.level) : prev, 0) || 0;

    return (
        <div className="space-y-8">
            {/* 1B. Brand Status Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{brandName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{brandPilot}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                        <span className="text-xs text-gray-400">Active Rule Set: <span className="text-blue-600 font-mono">Inventory-Ops v1.2</span></span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Data Ingest</div>
                    <div className="text-sm font-bold text-gray-700">2026-01-08 20:00:00 <span className="text-green-500 ml-1">(Synced)</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1C. Autonomy Level Indicator */}
                <div className="lg:col-span-2">
                    <AutonomyLevelIndicator currentLevel={currentAutonomyLevel} />
                </div>

                {/* 1D. Trust Metrics Overview */}
                <div className="space-y-4">
                    <MetricCard
                        title="Rule Acceptance"
                        value={ruleAcceptance}
                        suffix="%"
                        status={ruleAcceptance >= 90 ? 'good' : 'warning'}
                    />
                    <MetricCard
                        title="AI Agreement"
                        value={aiAgreement}
                        suffix="%"
                        status={aiAgreement >= 85 ? 'good' : 'warning'}
                    />
                    <MetricCard
                        title="Rollback Rate"
                        value={rollbackRate}
                        suffix="%"
                        status={rollbackRate <= 2 ? 'good' : 'danger'}
                    />
                </div>
            </div>

            {/* Phase 4.0: Human-Assisted Operations (Staging Area) */}
            <div>
                <ActionStagingArea
                    brandId={brandId}
                    actions={actionsData?.actions || []}
                    onRefresh={() => {
                        refetchActions();
                        refetchHistory();
                    }}
                />
            </div>

            {/* 1E. Suggest Mode Inbox (Advisory Layer) */}
            <div className="mb-10 space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black tracking-widest uppercase text-gray-800">Autonomous Operation Center</h2>
                    <div className="h-px flex-grow bg-gray-100"></div>
                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Execution Layer Active</span>
                </div>

                {/* Phase 3.5: Quality Audit Dashboard */}
                <SuggestionQualityDashboard report={qualityData} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SuggestionNoisePanel alerts={qualityData?.noiseAlerts || []} />
                    <ConsistencyWarningCard warnings={qualityData?.consistencyWarnings || []} />
                </div>

                <SuggestionInbox brandId={brandId} onActionPromoted={refetchActions} />
            </div>

            {/* 3. Simulation Center */}
            <SimulationPanel brandId={brandId} />

            {/* 2. Decision History & Audit Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Decision History & Audit Trail</h3>
                        <p className="text-sm text-gray-500">Immutable log of system evaluations and triggered rules.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-100 rounded text-[10px] font-bold text-emerald-600 uppercase cursor-help" title="Verified by deterministic controller">Audit Verified</span>
                    </div>
                </div>

                <DecisionAuditTable
                    brandId={brandId}
                    data={historyData?.executions || []}
                    loading={loadingHistory}
                />
            </div>
        </div>
    );
}
