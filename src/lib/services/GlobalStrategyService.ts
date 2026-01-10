
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import { OwnerService } from './OwnerService';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ExecutiveBriefing {
    summary: string;
    brandSpotlights: { brand: string; status: 'GOOD' | 'WARNING' | 'CRITICAL'; insight: string }[];
    strategicAction: string;
    generatedAt: Date;
}

export class GlobalStrategyService {

    async generateDailyBriefing(): Promise<ExecutiveBriefing> {
        const ownerService = new OwnerService();

        // 1. Gather Global Data
        const stats = await ownerService.getGlobalStats();
        const brands = await ownerService.getBrandComparison();
        const risks = await ownerService.getRisks();
        const consolidated = await ownerService.getConsolidatedFinancials();

        // 2. Construct AI Context
        const prompt = `
You are the Chief Strategy Officer (CSO) for Achiera Holding, a group managing multiple businesses (F&B "Rasa Ibu", Entertainment "Smart Billiard", etc).
Your job is to provide a concise "Morning Briefing" to the Owner.

Global Status:
- Total Revenue: ${stats.totalRevenue.toLocaleString('id-ID')}
- Total Cash: ${stats.totalCash.toLocaleString('id-ID')}
- Net Profit Margin: ${consolidated.netProfitMargin.toFixed(1)}%
- Active Risks: ${risks.length} (Details: ${risks.map(r => r.message).join(';')})

Brand Performance:
${brands.map(b => `- ${b.name}: Rev ${b.revenue.toLocaleString()}, Margin ${b.profitMargin.toFixed(1)}%, Efficiency ${b.efficiency}`).join('\n')}

INSTRUCTIONS:
1. Write a 2-sentence "Executive Summary" of the overall health.
2. For each brand, verify its status (GOOD/WARNING/CRITICAL) and give 1 short insight.
3. Recommend ONE single "Strategic Action" for today.

Output JSON format:
{
  "summary": "...",
  "brandSpotlights": [ { "brand": "Name", "status": "GOOD", "insight": "..." } ],
  "strategicAction": "..."
}
Respond ONLY in JSON. Use Bahasa Indonesia.
        `;

        // 3. Call Claude (Using 3.5 Sonnet for Strategy & Caching)
        try {
            const message = await (anthropic.messages as any).create({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 1000,
                system: [
                    {
                        type: "text",
                        text: "You are the Chief Strategy Officer for Achiera Holding. Tone: Executive, Professional, Concise.",
                        cache_control: { type: "ephemeral" }
                    }
                ],
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: "text",
                            text: prompt,
                            cache_control: { type: "ephemeral" }
                        }
                    ]
                }]
            });

            const content = message.content[0].type === 'text' ? message.content[0].text : '';
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error("Invalid JSON from AI");
            }

            const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1));

            return {
                summary: parsed.summary,
                brandSpotlights: parsed.brandSpotlights,
                strategicAction: parsed.strategicAction,
                generatedAt: new Date()
            };

        } catch (error) {
            console.error("AI Strategy Error:", error);
            // Fallback
            return {
                summary: "Sistem belum dapat menghasilkan briefing otomatis saat ini.",
                brandSpotlights: brands.map(b => ({
                    brand: b.name,
                    status: b.profitMargin > 20 ? 'GOOD' : 'WARNING',
                    insight: `Margin saat ini ${b.profitMargin.toFixed(1)}%`
                })),
                strategicAction: "Cek detail laporan keuangan manual.",
                generatedAt: new Date()
            };
        }
    }
}
