
'use server';

import { VoucherService } from '@/lib/services/VoucherService';

export async function validateVoucherAction(brandId: string, code: string, cartTotal: number) {
    try {
        const service = new VoucherService();
        const result = await service.validateVoucher(brandId, code, cartTotal);

        // Return serializable simple object
        return {
            success: result.isValid,
            discount: result.discountAmount || 0,
            message: result.error || (result.isValid ? `Voucher applied: -Rp ${result.discountAmount?.toLocaleString('id-ID')}` : 'Invalid Voucher')
        };
    } catch (error: any) {
        console.error('Voucher Validation Error:', error);
        return {
            success: false,
            discount: 0,
            message: 'Terjadi kesalahan saat memvalidasi voucher.'
        };
    }
}
