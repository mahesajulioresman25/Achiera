'use server';

import { prisma } from '@/lib/prisma';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';

/**
 * Retrieves loyalty member information by phone number, including global holding points.
 */
export async function getMemberInfoAction(brandId: string, customerPhone: string) {
    try {
        if (!customerPhone) throw new Error('Nomor telepon diperlukan.');

        // Get brand-specific info
        const member = await prisma.loyaltyMember.findUnique({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone
                }
            },
            select: {
                id: true,
                customerName: true,
                availablePoints: true,
                tier: true,
                birthday: true,
                totalSpent: true,
                lifetimePoints: true
            }
        });

        // Get global holding info
        const globalInfo = await loyaltyEngine.getGlobalMemberInfo(customerPhone);

        if (!member && !globalInfo) {
            return {
                success: false,
                error: 'Member tidak ditemukan. Poin akan didapatkan setelah pesanan pertama.'
            };
        }

        return {
            success: true,
            data: {
                ...(member || {}),
                customerName: member?.customerName || globalInfo?.customerName,
                globalPoints: globalInfo?.globalAvailablePoints || 0,
                isGlobal: !!globalInfo
            }
        };
    } catch (error: any) {
        console.error('Loyalty lookup error:', error);
        return {
            success: false,
            error: error.message || 'Gagal memeriksa poin.'
        };
    }
}

/**
 * Updates a member's birthday.
 */
export async function updateMemberBirthdayAction(brandId: string, customerPhone: string, birthday: string, customerName?: string) {
    try {
        if (!customerPhone || !birthday) throw new Error('Data tidak lengkap.');

        // 1. Check if member exists and already has a birthday
        const existingMember = await prisma.loyaltyMember.findUnique({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone
                }
            }
        });

        if (existingMember?.birthday) {
            return { success: false, error: 'Tanggal lahir sudah tersimpan dan tidak dapat diubah kembali. Hubungi admin jika ada kesalahan input.' };
        }

        // Generate a referral code in case we're creating a new record
        const namePart = (customerName || 'USER').substring(0, 3).toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const referralCode = `${namePart}${randomPart}`;

        const updated = await prisma.loyaltyMember.upsert({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone
                }
            },
            update: {
                birthday: new Date(birthday)
            },
            create: {
                brandId,
                customerPhone,
                customerName: customerName || 'Member',
                birthday: new Date(birthday),
                referralCode,
                tier: 'BRONZE',
                totalPoints: 0,
                availablePoints: 0,
                lifetimePoints: 0
            }
        });

        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Update birthday error:', error);
        return { success: false, error: 'Gagal memperbarui tanggal lahir.' };
    }
}
