// Prompt Builder - Build AI prompts for different explanation types
// CRITICAL: Strict prompt templates, no user input injection

import { AIContext, AIPromptRequest, AIPromptResponse, PromptType } from './types';

const SYSTEM_PROMPT = `You are a business analyst for Achiera. 
Tone: Professional, Warm, Data-Driven (Bahasa Indonesia).

STRICT RULES:
1. ADVISORY ONLY. No execution authority.
2. Cite only provided data. No hallucinations.
3. Be concise. Avoid filler words. Use bullet points for data.
4. Output: Strict JSON only.`;

/**
 * Build AI prompt based on type
 */
export function buildPrompt(request: AIPromptRequest): AIPromptResponse {
  const { type, context, options } = request;

  let prompt: string;
  let maxTokens = options?.maxTokens || context.maxTokens;
  let temperature = 0.3; // Low temperature for consistency

  switch (type) {
    case PromptType.RULE_EXPLANATION:
      prompt = buildRuleExplanationPrompt(context);
      break;

    case PromptType.IMPACT_ANALYSIS:
      prompt = buildImpactAnalysisPrompt(context);
      break;

    case PromptType.ALTERNATIVE_STRATEGY:
      prompt = buildAlternativeStrategyPrompt(context);
      break;

    case PromptType.RISK_DISCLOSURE:
      prompt = buildRiskDisclosurePrompt(context);
      break;

    case PromptType.EXECUTIVE_SUMMARY:
      prompt = buildExecutiveSummaryPrompt(context);
      temperature = 0.5; // Slightly higher for summary
      break;

    case PromptType.SETTLEMENT_PARSING:
      prompt = buildSettlementParsingPrompt(options?.rawContent || '');
      temperature = 0.1;
      maxTokens = 2000;
      break;

    case PromptType.RECEIPT_SCANNING:
      prompt = buildReceiptScanningPrompt();
      temperature = 0.1;
      maxTokens = 2048;
      break;

    default:
      throw new Error(`Unknown prompt type: ${type}`);
  }

  return {
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    maxTokens,
    temperature
  };
}

/**
 * Build rule explanation prompt
 */
function buildRuleExplanationPrompt(context: AIContext): string {
  const { rule, metrics } = context;

  return `TRIGGER: ${rule.name} (${rule.domain})
METRICS:
${formatMetrics(metrics.current)}
THRESHOLDS:
${formatThresholds(metrics.thresholds)}

Task: Jelaskan mengapa aturan ini terpicu dan dampaknya bagi bisnis.
Output JSON:
{
  "why_triggered": "...",
  "data_points": ["metric: value vs threshold", ...],
  "business_impact": "...",
  "confidence": 0.0-1.0
}`;
}

/**
 * Build impact analysis prompt
 */
function buildImpactAnalysisPrompt(context: AIContext): string {
  const { decision, metrics } = context;

  return `PROPOSED ACTION: ${decision.estimatedImpact.type}
RISK TIER: ${decision.riskTier}
AUTONOMY LEVEL: ${decision.autonomyLevel}

CURRENT STATE:
${formatMetrics(metrics.current)}

ESTIMATED CHANGE:
${formatEstimatedImpact(decision.estimatedImpact)}

${formatHistoricalContext(context)}

TASK:
Analyze the expected impact:
1. Financial impact (cost savings or revenue change)
2. Risk level assessment
3. Confidence in estimate
4. What could go wrong

OUTPUT (JSON):
{
  "expected_impact": {
    "type": "cost_savings|revenue_increase|risk_reduction",
    "amount": number,
    "confidence": 0.0-1.0
  },
  "risks": ["risk1", "risk2"],
  "success_criteria": "..."
}`;
}

/**
 * Build alternative strategy prompt
 */
function buildAlternativeStrategyPrompt(context: AIContext): string {
  return `CURRENT RECOMMENDATION: ${context.rule.name}
PROBLEM: Rule triggered due to threshold breach
CONSTRAINTS:
- Must use actions from approved catalog
- Must be reversible
- Must respect brand constraints

TASK:
Suggest 2-3 alternative strategies:
1. Different action approach
2. Different timing
3. Different parameters

For each alternative, explain:
- Why it might be better
- Trade-offs
- Risk level

OUTPUT (JSON):
{
  "alternatives": [
    {
      "action_id": "...",
      "rationale": "...",
      "trade_offs": "...",
      "risk_level": "LOW|MEDIUM|HIGH"
    }
  ]
}`;
}

/**
 * Build risk disclosure prompt
 */
function buildRiskDisclosurePrompt(context: AIContext): string {
  const { decision } = context;

  return `ACTION: ${context.rule.name}
IMPACT: ${formatEstimatedImpact(decision.estimatedImpact)}
REVERSIBILITY: ${decision.approvalRequired ? 'Requires approval' : 'Auto-executable'}

TASK:
Identify and explain risks:
1. Financial risks
2. Operational risks
3. Brand risks
4. Data quality risks

For each risk, provide:
- Severity (LOW/MEDIUM/HIGH)
- Likelihood (LOW/MEDIUM/HIGH)
- Mitigation strategy

OUTPUT (JSON):
{
  "risks": [
    {
      "type": "financial|operational|brand|data",
      "severity": "LOW|MEDIUM|HIGH",
      "likelihood": "LOW|MEDIUM|HIGH",
      "description": "...",
      "mitigation": "..."
    }
  ]
}`;
}

/**
 * Build executive summary prompt
 */
function buildExecutiveSummaryPrompt(context: AIContext): string {
  const { rule, decision } = context;

  return `DECISION: ${rule.name}
IMPACT: ${formatEstimatedImpact(decision.estimatedImpact)}
RISK: ${decision.riskTier}

TASK:
Create executive summary (2-3 sentences max):
1. Bottom-line impact
2. Key risk
3. Recommended action

Tone: Professional, concise, action-oriented
Language: Indonesian

OUTPUT (JSON):
{
  "executive_summary": "...",
  "key_metric": "...",
  "recommendation": "approve|review|reject"
}`;
}

/**
 * Format metrics for prompt
 */
function formatMetrics(metrics: Record<string, number>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `- ${key}: ${formatNumber(value)}`)
    .join('\n');
}

/**
 * Format thresholds for prompt
 */
function formatThresholds(thresholds: Record<string, number>): string {
  return Object.entries(thresholds)
    .map(([key, value]) => `- ${key}: ${formatNumber(value)}`)
    .join('\n');
}

/**
 * Format estimated impact for prompt
 */
function formatEstimatedImpact(impact: any): string {
  const parts = [`Type: ${impact.type}`];

  if (impact.amount) {
    parts.push(`Amount: Rp ${formatNumber(impact.amount)}`);
  }

  if (impact.percentage) {
    parts.push(`Percentage: ${impact.percentage}%`);
  }

  if (impact.revenueRisk) {
    parts.push(`Revenue Risk: Rp ${formatNumber(impact.revenueRisk)}`);
  }

  return parts.join('\n');
}

/**
 * Format historical context for prompt
 */
function formatHistoricalContext(context: AIContext): string {
  const { history, metrics } = context;

  const parts = ['HISTORICAL CONTEXT:'];

  if (history.similarDecisions > 0) {
    parts.push(`- Similar decisions: ${history.similarDecisions}`);
    parts.push(`- Success rate: ${(history.successRate * 100).toFixed(0)}%`);
  }

  if (history.lastExecution) {
    parts.push(`- Last execution: ${history.lastExecution.toISOString()}`);
  }

  if (metrics.historical && metrics.historical.dates.length > 0) {
    parts.push(`- Historical data: ${metrics.historical.dates.length} days`);
  }

  return parts.join('\n');
}

/**
 * Build settlement parsing prompt for raw email content or text
 */
function buildSettlementParsingPrompt(rawContent: string): string {
  return `TASK: Extract platform settlement/payout data from the raw email content below.
    
RAW CONTENT:
"""
${rawContent}
"""

TARGET DATA POINTS:
1. Platform Name (SHOPEE, TOKOPEDIA, GRABFOOD, GOFOOD, etc.)
2. Settlement Date or Payout Date
3. List of Orders containing:
   - Order ID or Invoice No
   - Gross Amount (Harga Produk)
   - Platform Fees/Commissions (Biaya Layanan/Admin)
   - Shipping Adjustments (if any)
   - Net Amount for each order
4. Grand Total Net Payout

RULES:
- If a data point is missing, use null.
- Extract ONLY from the provided content.
- Identify the currency (default to IDR if Rp mentioned).

OUTPUT FORMAT (Strict JSON):
{
  "platform": "UPPERCASE_NAME",
  "settlementDate": "YYYY-MM-DD",
  "currency": "IDR",
  "orders": [
    {
      "externalOrderId": "...",
      "grossAmount": 0.0,
      "fees": 0.0,
      "netAmount": 0.0,
      "description": "..."
    }
  ],
  "totalNetPayout": 0.0,
  "confidence": 0.0-1.0
}`;
}

/**
 * Format number for display
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  } else {
    return value.toFixed(2);
  }
}

/**
 * Build receipt scanning prompt for Vision
 */
function buildReceiptScanningPrompt(): string {
  return `TASK: Extract transaction details from the receipt image.

TARGET DATA POINTS:
1. Merchant Name
2. Transaction Date (YYYY-MM-DD or DD/MM/YYYY)
3. Total Amount (Net)
4. Items List (Description, Quantity, Unit Price, Total Price)

OUTPUT FORMAT (Strict JSON):
{
  "merchant": "...",
  "date": "YYYY-MM-DD",
  "currency": "IDR",
  "totalAmount": 0.0,
  "items": [
    {
      "name": "...",
      "qty": 1,
      "price": 0.0,
      "total": 0.0
    }
  ],
  "confidence": 0.0-1.0
}

RULES:
- If date is missing, use null.
- Assume IDR if currency is not explicit but context implies Indonesia.
- Exclude tax/service charge lines from "items" list, but ensure "totalAmount" includes them.`;
}
