
import { PrismaClient } from '@prisma/client';
import { VoucherService } from '../src/lib/services/VoucherService';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Voucher Verification...');

    const brand = await prisma.brand.findFirst({ where: { slug: 'rasa-ibu' } });
    if (!brand) throw new Error('Brand rasa-ibu not found');

    const service = new VoucherService();
    const code = `TEST-${Date.now()}`;

    console.log(`Creating Voucher ${code}...`);
    try {
        await service.createVoucher({
            brandId: brand.id,
            code,
            discountType: 'FIXED',
            discountAmount: 10000,
            usageLimit: 10,
            minOrderAmount: 50000,
            description: 'Test Voucher'
        });
        console.log('Voucher Created!');
    } catch (e: any) {
        console.error('Failed to create voucher:');
        console.error('Message:', e.message);
        console.error('Code:', e.code);
        console.error('Meta:', e.meta);
        console.error('Full Error:', JSON.stringify(e, null, 2));
        return;
    }

    console.log('Validating Voucher...');
    const invalidRes = await service.validateVoucher(brand.id, code, 40000);
    console.log('Invalid (Below Min Spend) Result:', invalidRes.isValid ? 'FAIL' : 'PASS', invalidRes.error);

    const validRes = await service.validateVoucher(brand.id, code, 100000);
    console.log('Valid Result:', validRes.isValid ? 'PASS' : 'FAIL', validRes.discountAmount);

    if (validRes.isValid) {
        console.log('Incrementing Usage...');
        await service.incrementUsage(code, brand.id);
        const updated = await prisma.pricingRule.findFirst({ where: { code, brandId: brand.id } });
        console.log('New Usage Count:', updated?.usageCount);
    }

    // Cleanup
    console.log('Cleaning up...');
    await prisma.pricingRule.deleteMany({ where: { code } });
    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
