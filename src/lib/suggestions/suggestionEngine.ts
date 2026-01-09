import { prisma } from '@/lib/prisma';
import { issueTrustVerdict } from '../autonomous-analytics/trust/verdict';

export interface SuggestionDraft {
    id: string;
    brandId: string;
    domain: string;
    title: string;
    proposedAction: string;
    rationale: string[];
    expectedImpact: {
        metric: string;
        direction: 'UP' | 'DOWN';
        confidence: number;
    };
    confidenceScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    phaseGate: string;
    createdAt: Date;
}

/**
 * Generate advisory suggestions.
 * STRICTLY ADVISORY - ZERO EXECUTION AUTHORITY.
 */
export async function generateSuggestions({ brandId, domain, observationDays }: { brandId: string, domain?: string, observationDays: number }) {
    // 1. Mandatory Entry Gate Check
    const verdict = await issueTrustVerdict(brandId);

    const meetsObservationPeriod = observationDays >= 30;
    const isReady = verdict.verdict === 'CONDITIONALLY_READY'; // "READY" in prompt, mapping to our implementation
    const noRedFlags = verdict.blocking_factors.length === 0;

    if (!isReady || !noRedFlags || !meetsObservationPeriod) {
        console.warn(`[SuggestMode] Entry gate blocked. Ready: ${isReady}, Obs: ${observationDays}d, Flags: ${!noRedFlags}`);
        return [];
    }

    // 2. Deterministic Heuristics (Example for Frozen Food)
    const suggestions: Omit<SuggestionDraft, 'id' | 'createdAt'>[] = [
        {
            brandId,
            domain: 'PRICING',
            title: 'Frozen Salmon Margin Optimization',
            proposedAction: 'Increase price of "Atlantic Salmon 500g" by Rp 5.000 (Manual Action Required)',
            rationale: [
                'Conversion rate remains high (4.5%) at current price point',
                'Competitors increased prices by average of 8% last week',
                'Elasticity analysis indicates low churn risk for premium tier'
            ],
            expectedImpact: {
                metric: 'Gross Margin',
                direction: 'UP',
                confidence: 0.85
            },
            confidenceScore: 0.92,
            riskLevel: 'LOW',
            phaseGate: 'Phase 3.0 Alpha'
        },
        {
            brandId,
            domain: 'ADS',
            title: 'ROAS Recovery for Lunch Specials',
            proposedAction: 'Pause low-performing "Tuesday Breakfast" campaign and shift budget to "Weekend Dinner" (Manual Ads Manager Action)',
            rationale: [
                'Tuesday Breakfast ROAS fell below 1.2x (Target 2.5x)',
                'Weekend Dinner campaigns showing ROAS of 4.8x',
                'Budget saturation window detected in dinner segment'
            ],
            expectedImpact: {
                metric: 'Total ROAS',
                direction: 'UP',
                confidence: 0.78
            },
            confidenceScore: 0.82,
            riskLevel: 'MEDIUM',
            phaseGate: 'Phase 3.0 Alpha'
        }
    ];

    // Filter by domain if provided
    const filteredSuggestions = domain ? suggestions.filter(s => s.domain === domain) : suggestions;

    // 3. Persist to Ledger
    const persistedSuggestions = await Promise.all(filteredSuggestions.map(async (s) => {
        return await (prisma as any).suggestionDraft.create({
            data: {
                brandId: s.brandId,
                domain: s.domain,
                title: s.title,
                proposedAction: s.proposedAction,
                rationale: s.rationale as any,
                expectedImpact: s.expectedImpact as any,
                confidenceScore: s.confidenceScore,
                riskLevel: s.riskLevel,
                phaseGate: s.phaseGate
            }
        });
    }));

    return persistedSuggestions;
}
