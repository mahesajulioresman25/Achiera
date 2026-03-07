
function parseCSVLine(line: string, delimiter: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === delimiter && !inQuotes) {
            result.push(line.substring(start, i).trim());
            start = i + 1;
        }
    }
    result.push(line.substring(start).trim());
    return result;
}

const parseAmount = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/[Rp\s]/g, '');
    if (clean.includes(',') && clean.includes('.')) {
        return clean.indexOf(',') > clean.indexOf('.') ?
            parseFloat(clean.replace(/\./g, '').replace(',', '.')) :
            parseFloat(clean.replace(/,/g, ''));
    }
    if (clean.includes(',')) {
        const parts = clean.split(',');
        if (parts[parts.length - 1].length === 2) return parseFloat(clean.replace(',', '.'));
        return parseFloat(clean.replace(',', ''));
    }
    return parseFloat(clean) || 0;
};

const headersRaw = "No.,Transaction Type,Order ID,Order Pick up ID,Store ID,Store Name,Order Create Time,Order Complete/Cancel Time,Order Amount,Merchant Service Charge,PB1,Merchant Surcharge Fee,Merchant Shipping Fee Voucher Subsidy,Platform Flash Sale Subsidy,Food Direct Discount,Merchant Food Voucher Subsidy,Merchant Voucher Deals Subsidy,Subtotal,Total,Commission,Net Income,Order Status,Order Type";
const sampleRow = "1,Delivery order,2976947300281856841,#1,21531454,Homey Pasta,26/02/2026 06:47:23,26/02/2026 07:14:41,78000,0,0,0,0,0,0,0,0,78000,78000,19500,58500,Settled,ASAP order";

const headers = parseCSVLine(headersRaw, ',');
const cols = parseCSVLine(sampleRow, ',');

const orderIdIdx = headers.findIndex(h => h.includes('No. Pesanan') || h.includes('Order ID') || h.includes('Order SN') || h.includes('Reference'));
const netAmountIdx = headers.findIndex(h => h.includes('Net Income') || h.includes('Net Payout') || h.includes('Penghasilan Bersih') || h.includes('Payout Amount') || h.includes('Net Amount'));
const grossAmountIdx = headers.findIndex(h => h.includes('Order Amount') || h.includes('Subtotal') || h.includes('Total') || h.includes('Original Amount'));
const feesIdx = headers.findIndex(h => h.includes('Commission') || h.includes('Biaya Admin') || h.includes('Service Charge') || h.includes('Merchant Service Charge') || h.includes('Merchant Fee'));

console.log('Detected Indices:');
console.log(`- Order ID: ${orderIdIdx} (${headers[orderIdIdx]})`);
console.log(`- Net Amount: ${netAmountIdx} (${headers[netAmountIdx]})`);
console.log(`- Gross Amount: ${grossAmountIdx} (${headers[grossAmountIdx]})`);
console.log(`- Fees: ${feesIdx} (${headers[feesIdx]})`);

const orderId = cols[orderIdIdx];
const netAmount = parseAmount(cols[netAmountIdx]);
const grossAmount = parseAmount(cols[grossAmountIdx]);
const fees = parseAmount(cols[feesIdx]);

console.log('\nExtracted Values:');
console.log(`OrderId: ${orderId}`);
console.log(`Net Amount: ${netAmount}`);
console.log(`Gross Amount: ${grossAmount}`);
console.log(`Fees: ${fees}`);
console.log(`Calculated Net (Gross - Fees): ${grossAmount - fees}`);

if (netAmount === 58500 && orderId === "2976947300281856841") {
    console.log('\n✅ Extraction SUCCESS!');
} else {
    console.log('\n❌ Extraction FAILED!');
}
