
import Anthropic from '@anthropic-ai/sdk';
import { MonthlyData } from '@/lib/services/MonthlyReportService';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export interface AIAnalysis {
    executiveSummary: string;
    insights: string[];
    recommendations: string[];
    forecast: string;
}

export async function analyzeMonthlyData(data: MonthlyData): Promise<AIAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const prompt = `
You are an expert business analyst for "Rasa Ibu", a food & beverage business.
Analyze the following monthly business data and provide a strategic report.

Data for Period: ${data.period.toISOString().split('T')[0]}

Financials:
- Revenue: Rp ${data.financial.revenue.toLocaleString('id-ID')} (${data.financial.growthRevenue > 0 ? '+' : ''}${data.financial.growthRevenue.toFixed(1)}% vs last month)
- Profit: Rp ${data.financial.profit.toLocaleString('id-ID')}
- Margin: ${data.financial.margin.toFixed(1)}%
- Expenses: Rp ${data.financial.expenses.toLocaleString('id-ID')}

Sales Metrics:
- Total Orders: ${data.sales.totalOrders}
- Top Products: ${data.sales.topProducts.map(p => `${p.name} (${p.quantity} qty, Rp ${p.revenue.toLocaleString('id-ID')})`).join(', ')}
- Channel Performance: ${JSON.stringify(data.sales.channelPerformance)}

Operational & Inventory:
- Waste Percentage: ${data.inventory.wastePercentage.toFixed(1)}% (Total items: ${data.inventory.totalWaste})
- Total Production: ${data.operational.totalProduction}

Please provide a structured response in valid JSON format with the following fields:
1. "executiveSummary": A concise 2-3 sentence summary of the overall business performance.
2. "insights": An array of 3-5 key takeaways, focusing on what went well and what needs attention (e.g., anomalies, growth drivers).
3. "recommendations": An array of 3-5 actionable steps to improve profitability, efficiency, or sales for next month.
4. "forecast": A 1-2 sentence prediction or focus area for the upcoming month based on current trends.

IMPORTANT: Provide the executiveSummary, insights, recommendations, and forecast ENTIRELY in Indonesian language (Bahasa Indonesia).
Ensure the tone is professional, encouraging, and insightful ("Rasa Ibu" style: warm but professional).
    `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        // Extract JSON from potential markdown code blocks if present
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        return JSON.parse(jsonString) as AIAnalysis;
    } catch (error) {
        console.error("AI Analysis failed:", error);
        // Fallback if AI fails
        return {
            executiveSummary: "Data bulanan telah dikumpulkan. Analisis otomatis saat ini tidak tersedia.",
            insights: ["Revenue mencapai Rp " + data.financial.revenue.toLocaleString('id-ID')],
            recommendations: ["Periksa laporan detail keuangan."],
            forecast: "Pantau tren penjualan manual untuk bulan depan."
        };
    }
}
