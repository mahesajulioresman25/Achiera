// AI Guardrails - Safety checks for AI output
// CRITICAL: Validate AI output, prevent hallucinations, enforce confidence thresholds

import { AIExplanation, AIGuardrails, ConfidenceScore } from './types';

const DEFAULT_GUARDRAILS: AIGuardrails = {
    min_confidence: 0.70,
    max_tokens: 4000,
    timeout_ms: 10000,
    require_citations: true,
    block_on_low_confidence: true
};

/**
 * Validate AI output against guardrails
 */
export function validateAIOutput(
    output: any,
    guardrails: AIGuardrails = DEFAULT_GUARDRAILS
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!output.explanation) {
        errors.push('Missing explanation field');
    }

    if (!output.recommended_action) {
        errors.push('Missing recommended_action field');
    }

    // Check confidence scores
    if (output.explanation?.confidence !== undefined) {
        if (output.explanation.confidence < 0 || output.explanation.confidence > 1) {
            errors.push('Invalid confidence score (must be 0.0-1.0)');
        }

        if (output.explanation.confidence < guardrails.min_confidence) {
            if (guardrails.block_on_low_confidence) {
                errors.push(`Confidence ${output.explanation.confidence} below threshold ${guardrails.min_confidence}`);
            } else {
                warnings.push(`Low confidence: ${output.explanation.confidence}`);
            }
        }
    }

    // Check data points cited
    if (guardrails.require_citations) {
        if (!output.explanation?.data_points || output.explanation.data_points.length === 0) {
            errors.push('No data points cited');
        }
    }

    // Check for hallucination indicators
    const hallucinations = detectHallucinations(output);
    if (hallucinations.length > 0) {
        errors.push(...hallucinations);
    }

    // Check risk levels
    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (output.recommended_action?.risk_level &&
        !validRiskLevels.includes(output.recommended_action.risk_level)) {
        errors.push('Invalid risk level');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Detect potential hallucinations in AI output
 */
function detectHallucinations(output: any): string[] {
    const hallucinations: string[] = [];

    // Check for suspicious phrases
    const suspiciousPhrases = [
        'based on industry standards',
        'according to research',
        'studies show',
        'experts say',
        'typically',
        'usually',
        'on average'
    ];

    const text = JSON.stringify(output).toLowerCase();

    for (const phrase of suspiciousPhrases) {
        if (text.includes(phrase)) {
            hallucinations.push(`Potential hallucination: "${phrase}" detected`);
        }
    }

    // Check for invented metrics
    if (output.explanation?.data_points) {
        for (const dataPoint of output.explanation.data_points) {
            if (typeof dataPoint === 'string') {
                // Check if data point looks like a metric citation
                if (!dataPoint.includes(':') && !dataPoint.includes('=')) {
                    hallucinations.push(`Suspicious data point: "${dataPoint}"`);
                }
            }
        }
    }

    return hallucinations;
}

/**
 * Calculate confidence score from multiple factors
 */
export function calculateConfidenceScore(
    dataCompleteness: number,
    historicalReliability: number,
    aiCertainty: number
): ConfidenceScore {
    // Weighted average
    const overall = (
        dataCompleteness * 0.4 +
        historicalReliability * 0.3 +
        aiCertainty * 0.3
    );

    return {
        overall,
        data_completeness: dataCompleteness,
        historical_reliability: historicalReliability,
        ai_certainty: aiCertainty
    };
}

/**
 * Apply safety filters to AI output
 */
export function applySafetyFilters(output: AIExplanation): AIExplanation {
    // Add warnings if confidence is low
    if (output.explanation.confidence < 0.70) {
        output.warnings.push(
            `INSUFFICIENT CONFIDENCE: AI confidence ${output.explanation.confidence.toFixed(2)} below recommended threshold 0.70`
        );
        output.warnings.push('RECOMMENDATION: Use deterministic rule output only');
        output.human_next_steps.push('Review metrics manually before acting');
    }

    // Add warnings if no historical data
    if (!output.metadata || output.metadata.context_tokens < 1000) {
        output.warnings.push('LIMITED CONTEXT: Insufficient historical data for reliable analysis');
    }

    // Ensure human review for high-risk actions
    if (output.recommended_action.risk_level === 'HIGH' ||
        output.recommended_action.risk_level === 'CRITICAL') {
        output.human_next_steps.unshift('CRITICAL: Human review required before execution');
    }

    return output;
}

/**
 * Create deterministic fallback when AI fails
 */
export function createDeterministicFallback(
    ruleName: string,
    metrics: Record<string, number>,
    thresholds: Record<string, number>
): AIExplanation {
    const dataPoints = Object.entries(metrics).map(([key, value]) => {
        const threshold = thresholds[key];
        return threshold
            ? `${key}: ${value} vs threshold ${threshold}`
            : `${key}: ${value}`;
    });

    return {
        explanation: {
            why_triggered: `Rule ${ruleName} triggered (deterministic evaluation)`,
            data_points: dataPoints,
            confidence: 1.0,
            source: 'deterministic_fallback'
        },
        recommended_action: {
            action_id: 'REVIEW_REQUIRED',
            expected_impact: 'Unknown - AI unavailable',
            risk_level: 'MEDIUM',
            rollback_available: true,
            confidence: 1.0
        },
        alternatives: [],
        risks: [
            {
                type: 'data',
                severity: 'MEDIUM',
                likelihood: 'HIGH',
                description: 'AI service unavailable - using deterministic fallback',
                mitigation: 'Review decision manually'
            }
        ],
        warnings: [
            'AI SERVICE UNAVAILABLE',
            'Using deterministic fallback only',
            'Human review recommended'
        ],
        human_next_steps: [
            'Review rule trigger manually',
            'Check metrics in dashboard',
            'Consult with team if uncertain'
        ],
        metadata: {
            ai_model: 'deterministic_fallback',
            generated_at: new Date(),
            context_tokens: 0,
            response_tokens: 0,
            processing_time_ms: 0
        }
    };
}

/**
 * Sanitize AI output (remove potential prompt injection)
 */
export function sanitizeAIOutput(output: any): any {
    // Remove any fields that shouldn't be in output
    const sanitized = { ...output };

    // Remove system instructions if present
    delete sanitized.system;
    delete sanitized.instructions;
    delete sanitized.prompt;

    // Sanitize strings (remove potential injection)
    const sanitizeString = (str: string): string => {
        return str
            .replace(/<script>/gi, '')
            .replace(/<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    };

    // Recursively sanitize all strings
    const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        } else if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        } else if (typeof obj === 'object' && obj !== null) {
            const sanitizedObj: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitizedObj[key] = sanitizeObject(value);
            }
            return sanitizedObj;
        }
        return obj;
    };

    return sanitizeObject(sanitized);
}
