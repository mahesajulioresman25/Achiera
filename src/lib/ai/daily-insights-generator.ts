
import Anthropic from '@anthropic-ai/sdk';
import { DailyData, Anomaly } from '@/lib/services/DailyInsightsService';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export interface DailyAIAnalysis {
    analysis: string;
    rootCause: string;
    recommendations: string[];
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function generateDailyInsights(data: DailyData, anomalies: Anomaly[]): Promise<DailyAIAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            analysis: "API Key Missing",
            rootCause: "System Config",
            recommendations: [],
            severity: 'LOW'
        };
    }

    const prompt = `
You are an intelligent business assistant for "Rasa Ibu".
Analyze today's business performance and any anomalies.

Daily Metrics:
- Revenue: Rp ${data.today.revenue.toLocaleString('id-ID')} (${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(1)}% vs yesterday)
- Orders: ${data.today.orders}
- Expenses: Rp ${data.today.expenses.toLocaleString('id-ID')} (${data.expenseChange.toFixed(1)}% change)

Anomalies Detected:
${anomalies.map(a => `- [${a.severity}] ${a.message}`).join('\n')}

Provide a JSON response with:
1. "analysis": 2-3 sentence summary of today's performance.
2. "rootCause": Likely reason for any anomalies (speculative based on common F&B patterns).
3. "recommendations": 2-3 short actionable items.
4. "severity": Overall severity level of the day's insights (HIGH, MEDIUM, LOW).

IMPORTANT: Provide the analysis, rootCause, and recommendations ENTIRELY in Indonesian language (Bahasa Indonesia).
Keep it concise and helpful for a busy owner.
    `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        return JSON.parse(jsonString) as DailyAIAnalysis;
    } catch (error) {
        console.error("Daily AI Insight failed:", error);
        return {
            analysis: "Analisis harian tersedia.",
            rootCause: "N/A",
            recommendations: ["Cek dashboard untuk detail."],
            severity: 'LOW'
        };
    }
}
