import { GoogleGenerativeAI } from "@google/generative-ai";

export interface VisionOrderResult {
    orderId?: string;
    customerName?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    totalAmount?: number;
}

export class VisionService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async extractOrderFromImage(base64Image: string): Promise<VisionOrderResult | null> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                Extract order details from this marketplace order screenshot.
                Return ONLY a JSON object with the following structure:
                {
                  "orderId": "string or null",
                  "customerName": "string or null",
                  "items": [
                    { "name": "string", "quantity": number, "price": number }
                  ],
                  "totalAmount": number or null
                }
                If price per item is not clear, use 0. If grand total is present, include it.
                Focus on product names and their quantities.
            `;

            const imageParts = [
                {
                    inlineData: {
                        data: base64Image.split(",")[1] || base64Image,
                        mimeType: "image/png",
                    },
                },
            ];

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response text (to handle potential markdown blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as VisionOrderResult;
            }

            return null;
        } catch (error) {
            console.error("[VisionService] Error extracting order:", error);
            return null;
        }
    }
}

export const visionService = new VisionService();
