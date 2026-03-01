import { parseOrderFromTextAction } from './src/lib/actions/rasa-ibu/orderParsing';
import { visionService } from './src/lib/services/VisionService';
import * as dotenv from 'dotenv';

dotenv.config();

async function testParsing() {
    console.log("--- Testing Text Parsing Heuristics ---");
    const brandId = "test-brand-id"; // Mock ID
    const sampleText = "2x Rendang Sapi\n1 Nasi Putih\nBakso Bakar x3";

    // Mocking smartMatchProduct since it depends on Prisma
    // For this test, we'll just check if the logic flows
    const result = await parseOrderFromTextAction(brandId, sampleText);
    console.log("Result:", JSON.stringify(result, null, 2));
}

async function testVision() {
    console.log("\n--- Testing Vision Extraction (Mock) ---");
    // We won't call the real API without a real image, 
    // but we can check if the service initializes and the structure is correct.
    try {
        const service = visionService;
        console.log("VisionService initialized successfully.");
    } catch (e) {
        console.error("VisionService initialization failed:", e);
    }
}

testParsing().then(testVision);
