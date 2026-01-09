import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export interface QualityReport {
    brandId: string;
    acceptanceRatio: number; // accepted / (accepted + rejected)
    deferredAgingIndex: number; // avg days in DEFERRED
    rejectionReasonClusters: { reason: string; count: number }[];
    noiseAlerts: { domain: string; count: number; risk: 'LOW' | 'HIGH' }[];
    consistencyWarnings: {
        sku: string;
        conflicts: { id: string; action: string; date: string }[]
    }[];
    status: 'HEALTHY' | 'NOISY' | 'LOW_SIGNAL' | 'INCONSISTENT';
    lastUpdated: string;
    statement: string;
}

/**
 * Evaluates AI suggestion quality without enabling autonomy.
 * STRICTLY INFORMATIONAL.
 */
export async function generateQualityAudit(brandId: string): Promise<QualityReport> {
    const statement = "Phase 3.5 evaluates AI suggestion quality only. It does not enable, recommend, or imply autonomy.";

    // 1. Fetch data
    const drafts = await (prisma as any).suggestionDraft.findMany({
        where: { brandId },
        include: { feedbacks: true },
        orderBy: { createdAt: 'desc' }
    });

    if (drafts.length === 0) {
        return {
            brandId,
            acceptanceRatio: 0,
            deferredAgingIndex: 0,
            rejectionReasonClusters: [],
            noiseAlerts: [],
            consistencyWarnings: [],
            status: 'LOW_SIGNAL',
            lastUpdated: new Date().toISOString(),
            statement
        };
    }

    // A. Suggestion Acceptance Ratio
    let accepted = 0;
    let rejected = 0;
    let deferredTotalDays = 0;
    let deferredCount = 0;
    const rejectionReasons: Record<string, number> = {};

    drafts.forEach((draft: any) => {
        draft.feedbacks.forEach((fb: any) => {
            if (fb.decision === 'ACCEPTED') accepted++;
            if (fb.decision === 'REJECTED') {
                rejected++;
                const reason = fb.reason || 'Unspecified';
                rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
            }
            if (fb.decision === 'DEFERRED') {
                deferredCount++;
                deferredTotalDays += differenceInDays(new Date(), new Date(fb.createdAt));
            }
        });
    });

    const acceptanceRatio = (accepted + rejected) > 0 ? (accepted / (accepted + rejected)) : 0;
    const deferredAgingIndex = deferredCount > 0 ? (deferredTotalDays / deferredCount) : 0;

    // B. Rejection Clusters
    const rejectionReasonClusters = Object.entries(rejectionReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // C. Noise & Fatigue Detection (7-day window)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDrafts = drafts.filter((d: any) => new Date(d.createdAt) >= sevenDaysAgo);
    const domainCounts: Record<string, number> = {};
    recentDrafts.forEach((d: any) => {
        domainCounts[d.domain] = (domainCounts[d.domain] || 0) + 1;
    });

    const noiseAlerts = Object.entries(domainCounts)
        .map(([domain, count]) => ({
            domain,
            count,
            risk: (count > 5 ? 'HIGH' : 'LOW') as 'LOW' | 'HIGH'
        }))
        .filter(alert => alert.risk === 'HIGH');

    // D. Consistency Validator (Same SKU/Topic within 14 days)
    const consistencyWarnings: QualityReport['consistencyWarnings'] = [];
    const draftsByTitle: Record<string, any[]> = {};

    drafts.forEach((d: any) => {
        if (!draftsByTitle[d.title]) draftsByTitle[d.title] = [];
        draftsByTitle[d.title].push(d);
    });

    Object.entries(draftsByTitle).forEach(([title, group]) => {
        if (group.length > 1) {
            const sortedGroup = group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            // Simplistic check: If actions differ significantly (mock logic)
            // In a real system, we'd compare the actual payload values
            const latest = sortedGroup[0];
            const previous = sortedGroup[1];

            if (latest.proposedAction !== previous.proposedAction && differenceInDays(new Date(latest.createdAt), new Date(previous.createdAt)) <= 14) {
                consistencyWarnings.push({
                    sku: title,
                    conflicts: sortedGroup.slice(0, 2).map(d => ({
                        id: d.id,
                        action: d.proposedAction,
                        date: new Date(d.createdAt).toLocaleDateString()
                    }))
                });
            }
        }
    });

    // E. Quality Gate Verdict
    let status: QualityReport['status'] = 'HEALTHY';
    if (consistencyWarnings.length > 0) status = 'INCONSISTENT';
    else if (noiseAlerts.length > 0) status = 'NOISY';
    else if (acceptanceRatio < 0.4 || drafts.length < 5) status = 'LOW_SIGNAL';
    else if (acceptanceRatio >= 0.7) status = 'HEALTHY';

    return {
        brandId,
        acceptanceRatio,
        deferredAgingIndex,
        rejectionReasonClusters,
        noiseAlerts,
        consistencyWarnings,
        status,
        lastUpdated: new Date().toISOString(),
        statement
    };
}
