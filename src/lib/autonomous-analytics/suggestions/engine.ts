import { prisma } from '@/lib/prisma';
import { issueTrustVerdict } from '../trust/verdict';

export interface SuggestionDraft {
    suggestion_id: string;
    domain: 'PRICING' | 'ADS' | 'INVENTORY' | 'SALES';
    summary: string;
    rationale: string[];
    expected_impact: {
        metric: string;
        direction: 'UP' | 'DOWN';
        confidence: number;
    };
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence_score: number;
    human_review_required: true;
    execution_capability: false;
}

/**
 * Generates an advisory suggestion based on current brand context.
 * STRICTLY ADVISORY - NO EXECUTION AUTHORITY.
 */
export async function generateSuggestion(brandId: string, context: any): Promise<SuggestionDraft | null> {
    // 1. Mandatory Entry Gate Check
    const verdict = await issueTrustVerdict(brandId);

    // Hard Gate: Must be CONDITIONALLY_READY, No Red Flags, >= 30 days observation
    const meetsObservationPeriod = verdict.observation_days >= 30;
    const isReady = verdict.verdict === 'CONDITIONALLY_READY';
    const noRedFlags = verdict.blocking_factors.length === 0;

    if (!isReady || !noRedFlags || !meetsObservationPeriod) {
        console.warn(`[SuggestMode] Entry gate prevented suggestion generation for ${brandId}. Reason: ${verdict.verdict}, Obs: ${verdict.observation_days}d`);
        return null;
    }

    // 2. Draft Generation (Mocked for now with deterministic logic)
    // In a real scenario, this would query market data, inventory, and campaign performance
    const mockDomainPool: SuggestionDraft['domain'][] = ['PRICING', 'ADS', 'INVENTORY', 'SALES'];
    const domain = mockDomainPool[Math.floor(Math.random() * mockDomainPool.length)];

    let draft: SuggestionDraft;

    switch (domain) {
        case 'PRICING':
            draft = {
                suggestion_id: `SUG-${Date.now()}`,
                domain: 'PRICING',
                summary: 'Incremental price optimization for Frozen Salmon 500g',
                rationale: [
                    'Current competitor price is 5% higher',
                    'High conversion rate (4.2%) suggests ceiling elasticity',
                    'Inventory levels are stable at 450 units'
                ],
                expected_impact: {
                    metric: 'Gross Margin',
                    direction: 'UP',
                    confidence: 0.88
                },
                risk_level: 'LOW',
                confidence_score: 0.92,
                human_review_required: true,
                execution_capability: false
            };
            break;
        case 'ADS':
            draft = {
                suggestion_id: `SUG-${Date.now()}`,
                domain: 'ADS',
                summary: 'Optimize ROAS for "Budget Pack" campaign',
                rationale: [
                    'ROAS fell below 2.5x in the last 48 hours',
                    'CPCs increased by 12% for primary keywords',
                    'Segment performance shows diminishing returns in weekend traffic'
                ],
                expected_impact: {
                    metric: 'ROAS',
                    direction: 'UP',
                    confidence: 0.82
                },
                risk_level: 'MEDIUM',
                confidence_score: 0.85,
                human_review_required: true,
                execution_capability: false
            };
            break;
        case 'INVENTORY':
            draft = {
                suggestion_id: `SUG-${Date.now()}`,
                domain: 'INVENTORY',
                summary: 'Restock warning: Chicken Breast (Skinless)',
                rationale: [
                    'Velocity increased by 40% due to local gym partnership',
                    'Safety stock threshold (50 units) breached',
                    'Supplier lead time is currently 3 days'
                ],
                expected_impact: {
                    metric: 'Out-of-Stock Frequency',
                    direction: 'DOWN',
                    confidence: 0.95
                },
                risk_level: 'LOW',
                confidence_score: 0.98,
                human_review_required: true,
                execution_capability: false
            };
            break;
        default:
            draft = {
                suggestion_id: `SUG-${Date.now()}`,
                domain: 'SALES',
                summary: 'Bundle proposal: Frozen Berries + Greek Yogurt',
                rationale: [
                    'Affinity analysis shows 35% overlap in purchase history',
                    'Bundled margin remains > 25% with 10% discount',
                    'Promotes movement of slow-moving berry SKU'
                ],
                expected_impact: {
                    metric: 'AOV',
                    direction: 'UP',
                    confidence: 0.89
                },
                risk_level: 'LOW',
                confidence_score: 0.91,
                human_review_required: true,
                execution_capability: false
            };
    }

    // 3. Persist to Suggestion Ledger (Audit-Only)
    await (prisma as any).suggestionDraft.create({
        data: {
            id: draft.suggestion_id,
            brandId: brandId,
            domain: draft.domain,
            summary: draft.summary,
            rationale: draft.rationale as any,
            expectedImpact: draft.expected_impact as any,
            riskLevel: draft.risk_level,
            confidenceScore: draft.confidence_score,
            status: 'ACTIVE'
        }
    });

    return draft;
}

/**
 * Record operator feedback for a suggestion.
 * This does NOT trigger execution.
 */
export async function recordSuggestionFeedback(
    brandId: string,
    suggestionId: string,
    signal: 'ACCEPTED' | 'REJECTED' | 'DEFERRED',
    reason?: string
) {
    return await (prisma as any).suggestionFeedback.create({
        data: {
            brandId,
            suggestionId,
            signal,
            reason
        }
    });
}
