// AI Overlay Integration - Enhance deterministic explanations with AI
// CRITICAL: AI never changes decisions, only enhances explanations

import Anthropic from '@anthropic-ai/sdk';
import { CFOExplanation } from '../explanations/explanation-types';
import { generateHumanSummary } from '../explanations/deterministic-explainer';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Enhance CFO explanation with AI overlay
 */
export async function enhanceWithAI(
    cfoExplanation: CFOExplanation
): Promise<CFOExplanation> {
    try {
        // Generate deterministic summary first
        const deterministicSummary = generateHumanSummary(cfoExplanation);

        // Build AI prompt
        const prompt = buildAIEnhancementPrompt(cfoExplanation, deterministicSummary);

        // Call AI
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.3,
            system: getSystemPrompt(),
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        // Extract AI response
        const aiOutput = extractJSON((response.content[0] as any).text);

        // Validate AI output
        const validation = validateAIOutput(aiOutput, cfoExplanation);

        if (!validation.valid) {
            console.warn('[AI Overlay] Validation failed, using deterministic only');
            return cfoExplanation;
        }

        // Add AI overlay to explanation
        const enhanced: CFOExplanation = {
            ...cfoExplanation,
            ai_overlay: {
                summary_indonesian: aiOutput.summary_indonesian,
                alternative_suggestions: aiOutput.alternative_suggestions || [],
                warnings: aiOutput.warnings || [],
                confidence: aiOutput.confidence || 0.5,
                model_used: 'claude-3-haiku-20240307'
            }
        };

        return enhanced;

    } catch (error) {
        console.error('[AI Overlay] Error:', error);

        // Fallback: return deterministic explanation without AI overlay
        return cfoExplanation;
    }
}

/**
 * Get system prompt for AI overlay
 */
function getSystemPrompt(): string {
    return `You are a business analyst assistant for an e-commerce platform.

STRICT RULES:
1. You CANNOT change the decision or risk assessment
2. You CANNOT modify financial impact estimates
3. You CANNOT override confidence scores
4. You can ONLY rephrase and add context in Indonesian
5. You MUST cite only the provided data
6. If confidence < 0.85, you MUST add warnings

Your role is to:
- Rephrase technical explanations into business-friendly Indonesian
- Suggest alternative strategies (from provided action catalog only)
- Add warnings if data quality is low

OUTPUT FORMAT: JSON only (strict schema)`;
}

/**
 * Build AI enhancement prompt
 */
function buildAIEnhancementPrompt(
    cfoExplanation: CFOExplanation,
    deterministicSummary: string
): string {
    return `DETERMINISTIC EXPLANATION:
${deterministicSummary}

METRICS:
${cfoExplanation.explanation.triggering_metrics.map(m =>
        `- ${m.metric_name}: ${m.formatted_current} vs threshold ${m.formatted_threshold}`
    ).join('\n')}

FINANCIAL IMPACT:
- Type: ${cfoExplanation.financial_impact.type}
- Amount: Rp ${cfoExplanation.financial_impact.estimated_amount_idr.toLocaleString('id-ID')}
- Confidence: ${cfoExplanation.financial_impact.confidence}

RISK: ${cfoExplanation.risk_assessment.risk_tier}

CONFIDENCE SCORE: ${(cfoExplanation.explanation.confidence_score * 100).toFixed(0)}%

TASK:
Rephrase the explanation in business-friendly Indonesian.
Add alternative suggestions if applicable.
Add warnings if confidence < 85% or data quality issues.

OUTPUT (JSON):
{
  "summary_indonesian": "...",
  "alternative_suggestions": ["...", "..."],
  "warnings": ["...", "..."],
  "confidence": 0.0-1.0
}`;
}

/**
 * Extract JSON from AI response
 */
function extractJSON(text: string): any {
    try {
        return JSON.parse(text);
    } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found');
    }
}

/**
 * Validate AI output (ensure it doesn't change decision)
 */
function validateAIOutput(
    aiOutput: any,
    originalExplanation: CFOExplanation
): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check required fields
    if (!aiOutput.summary_indonesian) {
        errors.push('Missing summary_indonesian');
    }

    // Check confidence score
    if (aiOutput.confidence < 0 || aiOutput.confidence > 1) {
        errors.push('Invalid confidence score');
    }

    // Ensure AI didn't try to change decision
    if (aiOutput.decision_changed === true) {
        errors.push('AI attempted to change decision (forbidden)');
    }

    // Ensure AI didn't try to change risk tier
    if (aiOutput.risk_tier && aiOutput.risk_tier !== originalExplanation.risk_assessment.risk_tier) {
        errors.push('AI attempted to change risk tier (forbidden)');
    }

    // Ensure AI didn't try to change financial impact
    if (aiOutput.financial_impact &&
        aiOutput.financial_impact !== originalExplanation.financial_impact.estimated_amount_idr) {
        errors.push('AI attempted to change financial impact (forbidden)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get AI overlay or fallback to deterministic
 */
export function getExplanationWithAI(
    cfoExplanation: CFOExplanation
): string {
    // If AI overlay exists and confidence is good, use it
    if (cfoExplanation.ai_overlay && cfoExplanation.ai_overlay.confidence >= 0.85) {
        return cfoExplanation.ai_overlay.summary_indonesian;
    }

    // Otherwise, use deterministic summary
    return generateHumanSummary(cfoExplanation);
}

/**
 * Check if AI overlay should be used
 */
export function shouldUseAIOverlay(
    cfoExplanation: CFOExplanation
): boolean {
    // Don't use AI if deterministic confidence is already very high
    if (cfoExplanation.explanation.confidence_score >= 0.95) {
        return false;
    }

    // Don't use AI if risk is CRITICAL (use deterministic only for safety)
    if (cfoExplanation.risk_assessment.risk_tier === 'CRITICAL') {
        return false;
    }

    // Use AI for enhancement
    return true;
}
