
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export type VoucherCreateInput = {
    brandId: string;
    code: string;
    discountType: 'FIXED' | 'PERCENT';
    discountAmount: number;
    usageLimit?: number;
    minOrderAmount?: number;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    targetVariants?: string[]; // Array of variant IDs
};

export class VoucherService {

    /**
     * Create a new voucher (PricingRule)
     */
    async createVoucher(input: VoucherCreateInput) {
        // Validate code uniqueness for brand
        const existing = await prisma.pricingRule.findUnique({
            where: {
                brandId_code: {
                    brandId: input.brandId,
                    code: input.code
                }
            }
        });

        if (existing) {
            throw new Error(`Voucher code "${input.code}" already exists for this brand.`);
        }

        return await prisma.pricingRule.create({
            data: {
                brandId: input.brandId,
                name: `Voucher ${input.code}`,
                code: input.code,
                description: input.description,
                ruleType: input.discountType,
                priceAdjustment: input.discountAmount,
                minPrice: input.minOrderAmount,
                usageLimit: input.usageLimit,
                startDate: input.startDate,
                endDate: input.endDate,
                condition: {}, // Required JSON field
                isActive: true,
                targetVariants: input.targetVariants ?? undefined
            }
        });
    }

    /**
     * Validate a voucher code against a cart total
     */
    async validateVoucher(brandId: string, code: string, cartTotal: number) {
        const voucher = await prisma.pricingRule.findUnique({
            where: {
                brandId_code: { brandId, code }
            }
        });

        if (!voucher) {
            return { isValid: false, error: 'Voucher not found' };
        }

        if (!voucher.isActive) {
            return { isValid: false, error: 'Voucher is inactive' };
        }

        // Check Date
        const now = new Date();
        if (voucher.startDate && now < voucher.startDate) {
            return { isValid: false, error: 'Voucher is not yet active' };
        }
        if (voucher.endDate && now > voucher.endDate) {
            return { isValid: false, error: 'Voucher has expired' };
        }

        // Check Usage Limit
        if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
            return { isValid: false, error: 'Voucher usage limit reached' };
        }

        // Check Min Spend
        if (voucher.minPrice && cartTotal < Number(voucher.minPrice)) {
            return {
                isValid: false,
                error: `Minimum spend of IDR ${Number(voucher.minPrice).toLocaleString()} required`
            };
        }

        // Calculate Discount
        let discountAmount = 0;
        if (voucher.ruleType === 'FIXED') {
            discountAmount = Number(voucher.priceAdjustment);
        } else if (voucher.ruleType === 'PERCENT') {
            discountAmount = (cartTotal * Number(voucher.priceAdjustment)) / 100;
        }

        // Cap discount if needed (could add maxDiscount field later)

        return {
            isValid: true,
            voucher,
            discountAmount: Math.min(discountAmount, cartTotal) // Can't discount more than total
        };
    }

    /**
     * Increment usage count after successful order
     */
    async incrementUsage(code: string, brandId: string, tx: Prisma.TransactionClient = prisma) {
        return await tx.pricingRule.update({
            where: { brandId_code: { brandId, code } },
            data: {
                usageCount: { increment: 1 },
                timesTriggered: { increment: 1 }
            }
        });
    }
}
