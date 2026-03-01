import { EmailParserService } from '../src/lib/services/EmailParserService';
import { prisma } from '../src/lib/prisma';

async function testParser() {
    const parser = new EmailParserService();
    console.log('--- TESTING EMAIL PARSER V2 ---');

    // 1. Test Date Extraction
    console.log('\n[1] Testing Date Extraction:');
    const testTexts = [
        "31 Januari 2026",
        "1 Feb 2026",
        "2026-03-15",
        "20/04/2026",
        "May 5, 2026"
    ];

    testTexts.forEach(t => {
        const d = (parser as any).extractDate(t);
        console.log(`Input: "${t}" -> Result: ${d || 'FAILED'}`);
    });

    // 2. Test Brand Detection with Platform Links
    console.log('\n[2] Testing Brand Detection:');
    // Fetch a real brand to test against
    const brands = await prisma.brand.findMany({
        take: 2,
        include: { brandConfig: true }
    });

    if (brands.length > 0) {
        for (const brand of brands) {
            console.log(`Testing Brand: ${brand.name} (${brand.id})`);
            const mockHtml = `Welcome to our shop at ${brand.slug}. Check our GrabFood at ${(brand.brandConfig?.platformLinks as any)?.grab || 'no-link'}`;
            const detected = await parser.detectBrandId('Weekly Report', mockHtml, brands.map(b => b.id));
            console.log(`Detected: ${detected === brand.id ? 'SUCCESS' : 'FAILED (' + detected + ')'}`);
        }
    }

    console.log('\n--- TEST COMPLETED ---');
}

testParser().catch(console.error).finally(() => prisma.$disconnect());
