'use server';

import Anthropic from '@anthropic-ai/sdk';
import { PromptType } from '@/lib/autonomous-analytics/ai/types';
import { buildPrompt } from '@/lib/autonomous-analytics/ai/prompt-builder';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function scanReceiptAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded' };
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

        // Get the prompt construction (we only need the system instructions mostly)
        // We reuse the prompt builder but specifically for the text instruction part
        const promptConfig = buildPrompt({
            type: PromptType.RECEIPT_SCANNING,
            context: {
                maxTokens: 2048,
                metrics: { current: {}, thresholds: {} }, // Dummy context
                rule: { ruleId: '', name: '', domain: '', priority: '', confidenceThreshold: 0 },
                decision: { riskTier: 'LOW', autonomyLevel: 0, estimatedImpact: { type: 'cost_savings' }, approvalRequired: false },
                brand: { brandId: '', industry: '', size: 'small', constraints: [] },
                history: { similarDecisions: 0, successRate: 0 }
            }
        });

        // Call Anthropic Vision
        const completion = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: promptConfig.maxTokens,
            temperature: promptConfig.temperature,
            system: "You are an AI assistant specialized in extracting data from receipt images.",
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: promptConfig.prompt
                        }
                    ],
                }
            ],
        });

        const rawResponse = (completion.content[0] as any).text;

        // Parse JSON from response (handle potential markdown blocks)
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse AI response' };
        }

        const data = JSON.parse(jsonMatch[0]);

        return { success: true, data };

    } catch (error: any) {
        console.error('Receipt Scan Error Status:', error.status);
        console.error('Receipt Scan Error Type:', error.type);
        console.dir(error, { depth: null });
        return { success: false, error: error.message };
    }
}
