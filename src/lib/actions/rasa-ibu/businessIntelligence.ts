'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { smartPricingEngine } from '@/lib/intelligence/smartPricingEngine';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';
import { revalidatePath } from 'next/cache';

// ===== SMART PRICING =====
export async function getPriceRecommendations(brandId: string) {
    try {
        const recommendations = await smartPricingEngine.getAllRecommendations(brandId);
        return { success: true, data: recommendations };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function applyPriceChange(variantId: string, newPrice: number, reason: string) {
    try {
        await smartPricingEngine.applyPriceChange(variantId, newPrice, reason, 'USER');
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPriceHistory(variantId: string) {
    try {
        const history = await prisma.priceHistory.findMany({
            where: { variantId },
            orderBy: { effectiveFrom: 'desc' },
            take: 10
        });
        return { success: true, data: JSON.parse(JSON.stringify(history)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== LOYALTY PROGRAM =====
export async function getLoyaltyMembers(brandId: string, tier?: string) {
    try {
        const members = await prisma.loyaltyMember.findMany({
            where: {
                brandId,
                ...(tier && { tier })
            },
            orderBy: { totalPoints: 'desc' },
            take: 50
        });
        return { success: true, data: JSON.parse(JSON.stringify(members)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getLoyaltyStats(brandId: string) {
    try {
        const stats = await loyaltyEngine.getMemberStats(brandId);
        return { success: true, data: stats };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getMemberDetails(memberId: string) {
    try {
        const member = await unisolatedPrisma.loyaltyMember.findUnique({
            where: { id: memberId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });
        return { success: true, data: JSON.parse(JSON.stringify(member)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createLoyaltyReward(
    brandId: string,
    name: string,
    description: string,
    pointsCost: number,
    rewardType: string,
    rewardValue: number
) {
    try {
        const reward = await prisma.loyaltyReward.create({
            data: {
                brandId,
                name,
                description,
                pointsCost,
                rewardType,
                rewardValue
            }
        });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(reward)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getLoyaltyRewards(brandId: string) {
    try {
        const rewards = await prisma.loyaltyReward.findMany({
            where: { brandId, isActive: true },
            orderBy: { pointsCost: 'asc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(rewards)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function redeemLoyaltyReward(memberId: string, rewardId: string) {
    try {
        const reward = await unisolatedPrisma.loyaltyReward.findUnique({
            where: { id: rewardId }
        });

        if (!reward) throw new Error('Reward not found');

        const result = await loyaltyEngine.redeemPoints(
            memberId,
            reward.pointsCost,
            `Redeemed: ${reward.name}`
        );

        await unisolatedPrisma.loyaltyReward.update({
            where: { id: rewardId },
            data: { timesRedeemed: { increment: 1 } }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== INTEGRATION WITH ORDERS =====
export async function processOrderLoyalty(
    brandId: string,
    customerPhone: string,
    customerName: string,
    orderAmount: number,
    orderId: string
) {
    try {
        // Get or create member
        const member = await loyaltyEngine.getOrCreateMember(
            brandId,
            customerPhone,
            customerName
        );

        // Award points
        const result = await loyaltyEngine.awardPoints(
            member.id,
            orderAmount,
            orderId
        );

        return { success: true, data: JSON.parse(JSON.stringify({ member, ...result })) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
// ===== AUTONOMOUS METADATA =====
export async function getAutonomousBrandAction(slug: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug },
            select: { name: true, slug: true }
        });
        return { success: true, data: brand };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
