// AI Explainer - Main AI explanation service
// CRITICAL: Advisory-only, no execution authority, full audit trail

import Anthropic from '@anthropic-ai/sdk';
import { RuleEvaluationResult } from '../types/decision';
import { assembleAIContext } from './context-assembler';
import { buildPrompt } from './prompt-builder';
import {
    validateAIOutput,
    applySafetyFilters,
    createDeterministicFallback,
    sanitizeAIOutput
} from './ai-guardrails';
import { AIExplanation, PromptType } from './types';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Generate AI explanation for a rule evaluation
 */
export async function explainDecision(
    ruleEvaluation: RuleEvaluationResult,
    brandId: string,
    promptType: PromptType = PromptType.RULE_EXPLANATION
): Promise<AIExplanation> {
    const startTime = Date.now();

    try {
        // Assemble context
        const context = await assembleAIContext(ruleEvaluation, brandId);

        // Build prompt
        const promptRequest = {
            type: promptType,
            context,
            options: {
                language: 'id' as const,
                tone: 'operator' as const
            }
        };

        const { prompt, systemPrompt, maxTokens, temperature } = buildPrompt(promptRequest);

        // Call AI with Caching enabled for system prompt and large context
        const response = await anthropic.messages.create({
            model: ruleEvaluation.riskLevel === 'HIGH' || ruleEvaluation.riskLevel === 'CRITICAL'
                ? 'claude-3-5-sonnet-20240620'
                : 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            temperature,
            system: [
                {
                    type: "text",
                    text: systemPrompt,
                    cache_control: { type: "ephemeral" } // Cache the system instructions
                }
            ],
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: "text",
                            text: prompt,
                            cache_control: { type: "ephemeral" } // Cache the complex context
                        }
                    ]
                }
            ]
        });

        // Extract JSON from response
        const aiOutput = extractJSON((response.content[0] as any).text);

        // Sanitize output
        const sanitized = sanitizeAIOutput(aiOutput);

        // Validate output
        const validation = validateAIOutput(sanitized);

        if (!validation.valid) {
            console.error('[AI EXPLAINER] Validation failed:', validation.errors);

            // Fall back to deterministic
            return createDeterministicFallback(
                ruleEvaluation.ruleName,
                ruleEvaluation.metricsSnapshot,
                context.metrics.thresholds
            );
        }

        // Build complete explanation
        const explanation: AIExplanation = {
            explanation: sanitized.explanation || {
                why_triggered: 'AI explanation unavailable',
                data_points: [],
                confidence: 0,
                source: 'deterministic_fallback'
            },
            recommended_action: sanitized.recommended_action || {
                action_id: ruleEvaluation.action.actionId,
                expected_impact: 'Unknown',
                risk_level: ruleEvaluation.riskLevel,
                rollback_available: true,
                confidence: 0
            },
            alternatives: sanitized.alternatives || [],
            risks: sanitized.risks || [],
            warnings: validation.warnings,
            human_next_steps: sanitized.human_next_steps || [],
            metadata: {
                ai_model: 'claude-3-haiku-20240307',
                generated_at: new Date(),
                context_tokens: response.usage.input_tokens,
                response_tokens: response.usage.output_tokens,
                processing_time_ms: Date.now() - startTime
            }
        };

        // Apply safety filters
        const filtered = applySafetyFilters(explanation);

        // Audit log
        await auditAIExplanation(brandId, ruleEvaluation.ruleId, filtered);

        return filtered;

    } catch (error) {
        console.error('[AI EXPLAINER] Error:', error);

        // Fall back to deterministic
        const context = await assembleAIContext(ruleEvaluation, brandId);
        return createDeterministicFallback(
            ruleEvaluation.ruleName,
            ruleEvaluation.metricsSnapshot,
            context.metrics.thresholds
        );
    }
}

/**
 * Generate multiple explanations (batch)
 */
export async function explainDecisionsBatch(
    ruleEvaluations: RuleEvaluationResult[],
    brandId: string
): Promise<AIExplanation[]> {
    const explanations: AIExplanation[] = [];

    for (const evaluation of ruleEvaluations) {
        const explanation = await explainDecision(evaluation, brandId);
        explanations.push(explanation);
    }

    return explanations;
}

/**
 * Generate executive summary
 */
export async function generateExecutiveSummary(
    ruleEvaluation: RuleEvaluationResult,
    brandId: string
): Promise<{
    summary: string;
    key_metric: string;
    recommendation: 'approve' | 'review' | 'reject';
}> {
    const explanation = await explainDecision(
        ruleEvaluation,
        brandId,
        PromptType.EXECUTIVE_SUMMARY
    );

    return {
        summary: explanation.explanation.why_triggered,
        key_metric: explanation.explanation.data_points[0] || 'N/A',
        recommendation: determineRecommendation(explanation)
    };
}

/**
 * Extract JSON from AI response
 */
function extractJSON(text: string): any {
    try {
        // Try to parse directly
        return JSON.parse(text);
    } catch {
        // Try to extract JSON from markdown code block
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // Try to extract JSON object
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            return JSON.parse(objectMatch[0]);
        }

        throw new Error('No valid JSON found in response');
    }
}

/**
 * Determine recommendation from explanation
 */
function determineRecommendation(
    explanation: AIExplanation
): 'approve' | 'review' | 'reject' {
    // High confidence + low risk = approve
    if (explanation.explanation.confidence >= 0.85 &&
        explanation.recommended_action.risk_level === 'LOW') {
        return 'approve';
    }

    // Low confidence or high risk = review
    if (explanation.explanation.confidence < 0.70 ||
        ['HIGH', 'CRITICAL'].includes(explanation.recommended_action.risk_level)) {
        return 'review';
    }

    // Critical warnings = reject
    if (explanation.warnings.some(w => w.includes('CRITICAL'))) {
        return 'reject';
    }

    return 'review';
}

/**
 * Audit AI explanation
 */
async function auditAIExplanation(
    brandId: string,
    ruleId: string,
    explanation: AIExplanation
): Promise<void> {
    // Log to audit trail
    console.log('[AI EXPLAINER] Explanation generated', {
        brandId,
        ruleId,
        confidence: explanation.explanation.confidence,
        model: explanation.metadata.ai_model,
        tokens: explanation.metadata.context_tokens + explanation.metadata.response_tokens,
        processing_time: explanation.metadata.processing_time_ms
    });

    // TODO: Store in database for audit trail
}
