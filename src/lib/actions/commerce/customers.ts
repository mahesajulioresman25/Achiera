'use server';

import { prisma } from '@/lib/prisma';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';

/**
 * Retrieves customer profile (Name, Address, Email) and Loyalty balance by phone number.
 * Used for repeat order autofill and loyalty status lookup.
 */
export async function getCustomerProfileByPhoneAction(brandId: string, phone: string) {
    try {
        if (!phone) throw new Error('Phone number is required');

        // 1. Get the most recent order for this phone/brand to get latest contact details
        const lastOrder = await prisma.order.findFirst({
            where: {
                brandId,
                customerPhone: phone,
                NOT: { customerName: null }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                customerName: true,
                customerAddress: true,
                customerEmail: true
            }
        });

        // 2. Get Loyalty Info
        // Note: loyaltyMember table might use phone-brand uniqueness or user linking.
        // We look up by phone primarily for public checkout/manual entry.
        const member = await prisma.loyaltyMember.findUnique({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone: phone
                }
            },
            select: {
                id: true,
                customerName: true,
                availablePoints: true,
                tier: true
            }
        });

        // 3. Get Global Points (if applicable)
        const globalInfo = await loyaltyEngine.getGlobalMemberInfo(phone);

        return {
            success: true,
            data: {
                // Priority: Last Order details > Loyalty Member details
                name: lastOrder?.customerName || member?.customerName || globalInfo?.customerName || '',
                address: lastOrder?.customerAddress || '',
                email: lastOrder?.customerEmail || '',
                loyalty: {
                    memberId: member?.id,
                    availablePoints: member?.availablePoints || 0,
                    tier: member?.tier || 'BRONZE',
                    globalPoints: globalInfo?.globalAvailablePoints || 0
                },
                isRepeatCustomer: !!lastOrder || !!member
            }
        };
    } catch (error: any) {
        console.error('[CustomerAction] Lookup error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
