
import { EmailParserService } from '../src/lib/services/EmailParserService';

async function main() {
    console.log('🧪 Starting Mock Email Parsing Test...');

    const parser = new EmailParserService();
    const brandId = 'mock-brand-id';

    // 1. Test Shopee Order
    console.log('\n--- Testing Shopee Order ---');
    const shopeeHtml = `
        <div>
            No. Pesanan: 240105SHP123<br>
            Nama: Budi Santoso<br>
            No. HP: 628123456789<br>
            Total Pembayaran: Rp 150.000<br>
            Produk: Ayam Bakar Spesial<br>
            Jumlah: 2
        </div>
    `;
    // We need to access private methods for deep testing or mock the processEmail
    // For simplicity, let's just test the public detectPlatform and regex logic
    const platform = parser.detectPlatform('noreply@shopee.co.id', 'Pesanan Baru 240105SHP123', shopeeHtml);
    console.log('Platform:', platform);

    // @ts-ignore - access private for testing
    const shopeeData = parser.parseShopeeEmail(shopeeHtml);
    console.log('Shopee Data:', shopeeData);

    // 2. Test Tokopedia Order
    console.log('\n--- Testing Tokopedia Order ---');
    const tokpedHtml = `
        <div>
            INV/20240105/MPL/12345678<br>
            Penerima: Siti Aminah<br>
            No. HP: 081299887766<br>
            Total Tagihan: Rp 75.500<br>
            Nama Barang: Paket Nasi Liwet<br>
            Quantity: 1
        </div>
    `;
    const tokpedData = (parser as any).parseTokopediaEmail(tokpedHtml);
    console.log('Tokopedia Data:', tokpedData);

    // 3. Test GrabFood Forwarded
    console.log('\n--- Testing GrabFood Forwarded ---');
    const grabSubject = 'Fwd: 4 Januari 2026 Ringkasan Penjualan untuk Orderan GrabFood Online';
    const grabPlatform = parser.detectPlatform('mahesajulioresman25@gmail.com', grabSubject, 'Laporan ringkasan penjualan GrabFood');
    console.log('Grab Platform Detection (Forwarded):', grabPlatform);

    console.log('\n✅ Mock Tests Completed');
}

main().catch(console.error);
