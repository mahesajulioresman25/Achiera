import { EmailParserService } from '../src/lib/services/EmailParserService';

async function testParserV3() {
    const parser = new EmailParserService() as any;
    const brandId = 'test-brand-id';

    console.log('--- Testing handleSettlementEmail (Body Parsing) ---');
    const mockEmailHtml = `
        <p>Halo Merchant,</p>
        <p>Laporan Settlement Anda:</p>
        <p>ID Pesanan: ORDER12345</p>
        <p>Total: Rp 150.000</p>
        <p>Potongan Admin: Rp 3.000</p>
        <p>Terima kasih.</p>
    `;
    // Note: handleSettlementEmail calls prisma, so we'd need a real DB or a mock.
    // For this demonstration, we'll just log the extraction logic if we were to isolate it,
    // but here we are directly testing the service methods.

    console.log('Testing GrabFood PDF Settlement Parsing...');
    const grabPdfText = `
        GrabFood Settlement Report
        Order ID: GRAB-98765
        Total Order IDR 200.000
        Commission IDR 40.000
        Net Settlement IDR 160.000
    `;
    await parser.handleGrabFoodPDFSettlement(grabPdfText, brandId);

    console.log('Testing Shopee PDF Settlement Parsing...');
    const shopeePdfText = `
        Shopee Settlement Summary
        No. Pesanan: SHOPEE554433
        Total Pelepasan Dana: Rp 95.000
        Biaya Admin: Rp 5.000
    `;
    await parser.handleShopeePDFSettlement(shopeePdfText, brandId);

    console.log('Verification finished. Check console logs for "Skeleton Order created".');
}

testParserV3().catch(console.error);
