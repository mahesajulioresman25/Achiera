import { prisma, unisolatedPrisma } from '@/lib/prisma';

// Define types manually to avoid build errors if Prisma client is out of sync
export interface LoyaltyMember {
    id: string;
    brandId: string;
    customerPhone: string;
    customerName: string;
    customerEmail: string | null;
    totalPoints: number;
    availablePoints: number;
    lifetimePoints: number;
    tier: string;
    totalSpent: any;
    totalOrders: number;
    avgOrderValue: any;
    isActive: boolean;
    referralCode: string;
    birthday: Date | null;
    isMarketingAllowed: boolean;
}

interface LoyaltyConfig {
    pointsPerRupiah: number; // Default: 1 point per Rp 10,000
    tierThresholds: {
        SILVER: number;
        GOLD: number;
        PLATINUM: number;
    };
    pointExpiryDays: number; // Default: 365 days
    pointValueInRupiah: number; // Default: 100
}

const DEFAULT_CONFIG: LoyaltyConfig = {
    pointsPerRupiah: 0.0001, // 1 point per Rp 10,000
    tierThresholds: {
        SILVER: 1000000, // Rp 1 juta lifetime spend
        GOLD: 5000000,   // Rp 5 juta lifetime spend
        PLATINUM: 10000000 // Rp 10 juta lifetime spend
    },
    pointExpiryDays: 365,
    pointValueInRupiah: 100
};

export class LoyaltyEngine {
    private async getConfig(brandId: string): Promise<LoyaltyConfig> {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const settings = (brand?.paymentSettings as any)?.loyalty || {};
        return {
            pointsPerRupiah: settings.pointsPerRupiah || DEFAULT_CONFIG.pointsPerRupiah,
            tierThresholds: {
                SILVER: settings.tierThresholds?.SILVER || DEFAULT_CONFIG.tierThresholds.SILVER,
                GOLD: settings.tierThresholds?.GOLD || DEFAULT_CONFIG.tierThresholds.GOLD,
                PLATINUM: settings.tierThresholds?.PLATINUM || DEFAULT_CONFIG.tierThresholds.PLATINUM,
            },
            pointExpiryDays: settings.pointExpiryDays || DEFAULT_CONFIG.pointExpiryDays,
            pointValueInRupiah: settings.pointValueInRupiah || DEFAULT_CONFIG.pointValueInRupiah
        };
    }
    async getMemberByPhone(brandId: string, customerPhone: string): Promise<LoyaltyMember | null> {
        return await (unisolatedPrisma as any).loyaltyMember.findUnique({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone
                }
            },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        }) as any;
    }

    /**
     * Create or get loyalty member
     */
    async getOrCreateMember(
        brandId: string,
        customerPhone: string,
        customerName: string,
        customerEmail?: string,
        isMarketingAllowed?: boolean
    ): Promise<LoyaltyMember> {
        let member = await (unisolatedPrisma as any).loyaltyMember.findUnique({
            where: {
                brandId_customerPhone: {
                    brandId,
                    customerPhone
                }
            }
        });

        if (!member) {
            // Generate unique referral code
            const referralCode = `${customerName.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            member = await (unisolatedPrisma as any).loyaltyMember.create({
                data: {
                    brandId,
                    customerPhone,
                    customerName,
                    customerEmail,
                    referralCode,
                    isMarketingAllowed: isMarketingAllowed !== undefined ? isMarketingAllowed : true
                } as any
            });
        } else if (isMarketingAllowed !== undefined && member.isMarketingAllowed !== isMarketingAllowed) {
            // Update if changed
            member = await (unisolatedPrisma as any).loyaltyMember.update({
                where: { id: member.id },
                data: { isMarketingAllowed }
            });
        }

        return member as LoyaltyMember;
    }

    /**
     * Award points for a purchase
     */
    async awardPoints(
        memberId: string,
        orderAmount: number,
        orderId: string,
        explicitConfig?: LoyaltyConfig
    ) {
        const member = await (unisolatedPrisma as any).loyaltyMember.findUnique({
            where: { id: memberId }
        });

        if (!member) throw new Error('Member not found');

        // Use explicit config or fetch dynamic config
        const config = explicitConfig || await this.getConfig(member.brandId);

        // Calculate points
        let points = Math.floor(orderAmount * config.pointsPerRupiah);

        // Tier multiplier
        const tierMultiplier = this.getTierMultiplier(member.tier);
        points = Math.floor(points * tierMultiplier);

        // Marketing opt-in multiplier (2x)
        let isMarketingBonus = false;
        if (member.isMarketingAllowed) {
            points *= 2;
            isMarketingBonus = true;
        }

        // Birthday bonus (2x points) - Exact day only
        let isBirthdayBonus = false;
        if (member.birthday) {
            const today = new Date();
            const birthday = new Date(member.birthday);
            if (today.getDate() === birthday.getDate() &&
                today.getMonth() === birthday.getMonth()) {
                points *= 2;
                isBirthdayBonus = true;
            }
        }

        // Update member stats
        const newTotalPoints = (member.totalPoints || 0) + points;
        const newAvailablePoints = (member.availablePoints || 0) + points;
        const newLifetimePoints = (member.lifetimePoints || 0) + points;
        const newTotalSpent = Number(member.totalSpent || 0) + orderAmount;
        const newTotalOrders = (member.totalOrders || 0) + 1;
        const newAvgOrderValue = newTotalSpent / newTotalOrders;

        // Check tier upgrade
        const newTier = this.calculateTier(newTotalSpent, config);

        await (unisolatedPrisma as any).loyaltyMember.update({
            where: { id: memberId },
            data: {
                totalPoints: newTotalPoints,
                availablePoints: newAvailablePoints,
                lifetimePoints: newLifetimePoints,
                totalSpent: newTotalSpent,
                totalOrders: newTotalOrders,
                avgOrderValue: newAvgOrderValue,
                tier: newTier,
                lastOrderDate: new Date(),
                daysSinceLastOrder: 0
            } as any
        });

        // Record transaction
        await (unisolatedPrisma as any).loyaltyTransaction.create({
            data: {
                brandId: member.brandId,
                memberId,
                type: 'EARN',
                points,
                orderId,
                description: `Earned ${points} points${isMarketingBonus ? ' (2x Subscriber Bonus)' : ''}${isBirthdayBonus ? ' (Birthday Bonus)' : ''} from order`,
                balanceBefore: member.availablePoints || 0,
                balanceAfter: newAvailablePoints,
                expiresAt: new Date(Date.now() + config.pointExpiryDays * 24 * 60 * 60 * 1000)
            } as any
        });

        return { points, newTier, tierUpgraded: newTier !== member.tier };
    }

    /**
     * Award a manual bonus (e.g., for Recipe Contribution)
     */
    async awardManualBonus(
        brandId: string,
        customerPhone: string,
        points: number,
        description: string
    ) {
        // 1. Get or create member
        // We use a blank email/marketing opt-in as we only have phone
        const member = await this.getOrCreateMember(brandId, customerPhone, "Bunda Penulis");

        // 2. Update member stats
        const newAvailablePoints = (member.availablePoints || 0) + points;
        const newTotalPoints = (member.totalPoints || 0) + points;
        const newLifetimePoints = (member.lifetimePoints || 0) + points;

        await (unisolatedPrisma as any).loyaltyMember.update({
            where: { id: member.id },
            data: {
                totalPoints: newTotalPoints,
                availablePoints: newAvailablePoints,
                lifetimePoints: newLifetimePoints
            } as any
        });

        // 3. Record transaction
        await (unisolatedPrisma as any).loyaltyTransaction.create({
            data: {
                brandId,
                memberId: member.id,
                type: 'EARN',
                points,
                description,
                balanceBefore: member.availablePoints || 0,
                balanceAfter: newAvailablePoints
            } as any
        });

        return { success: true, newBalance: newAvailablePoints };
    }

    /**
     * Redeem points for reward
     */
    async redeemPoints(
        memberId: string,
        pointsCost: number,
        description: string
    ) {
        const member = await (unisolatedPrisma as any).loyaltyMember.findUnique({
            where: { id: memberId }
        });

        if (!member) throw new Error('Member not found');
        if ((member.availablePoints || 0) < pointsCost) {
            throw new Error('Insufficient points');
        }

        const newAvailablePoints = (member.availablePoints || 0) - pointsCost;

        await (unisolatedPrisma as any).loyaltyMember.update({
            where: { id: memberId },
            data: {
                availablePoints: newAvailablePoints,
                totalPoints: (member.totalPoints || 0) - pointsCost
            } as any
        });

        await (unisolatedPrisma as any).loyaltyTransaction.create({
            data: {
                brandId: member.brandId,
                memberId,
                type: 'REDEEM',
                points: -pointsCost,
                description,
                balanceBefore: member.availablePoints || 0,
                balanceAfter: newAvailablePoints
            } as any
        });

        return { success: true, newBalance: newAvailablePoints };
    }

    /**
     * Calculate tier based on lifetime spend
     */
    private calculateTier(totalSpent: number, config: LoyaltyConfig): string {
        if (totalSpent >= config.tierThresholds.PLATINUM) return 'PLATINUM';
        if (totalSpent >= config.tierThresholds.GOLD) return 'GOLD';
        if (totalSpent >= config.tierThresholds.SILVER) return 'SILVER';
        return 'BRONZE';
    }

    /**
     * Get tier multiplier
     */
    private getTierMultiplier(tier: string): number {
        switch (tier) {
            case 'PLATINUM': return 2.0;
            case 'GOLD': return 1.5;
            case 'SILVER': return 1.25;
            default: return 1.0;
        }
    }

    /**
     * Get global member info across all brands
     */
    async getGlobalMemberInfo(customerPhone: string) {
        const members = await (unisolatedPrisma as any).loyaltyMember.findMany({
            where: { customerPhone },
            include: { brand: true }
        });

        if (members.length === 0) return null;

        const totalPoints = members.reduce((sum: number, m: any) => sum + (m.availablePoints || 0), 0);
        const lifetimePoints = members.reduce((sum: number, m: any) => sum + (m.lifetimePoints || 0), 0);
        const totalSpent = members.reduce((sum: number, m: any) => sum + Number(m.totalSpent || 0), 0);

        // Find best tier across brands
        const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        let bestTier = 'BRONZE';
        members.forEach((m: any) => {
            if (tiers.indexOf(m.tier) > tiers.indexOf(bestTier)) {
                bestTier = m.tier;
            }
        });

        return {
            customerPhone,
            customerName: members[0].customerName, // Assume name consistency for simplicity
            globalAvailablePoints: totalPoints,
            globalLifetimePoints: lifetimePoints,
            globalTotalSpent: totalSpent,
            bestTier,
            brandBreakdown: members.map((m: any) => ({
                brandName: m.brand.name,
                brandId: m.brandId,
                points: m.availablePoints,
                tier: m.tier
            }))
        };
    }

    /**
     * Get total available points for a phone number across the holding
     */
    async getGlobalBalance(customerPhone: string): Promise<number> {
        const result = await (unisolatedPrisma as any).loyaltyMember.aggregate({
            where: { customerPhone },
            _sum: {
                availablePoints: true
            }
        });
        return result._sum.availablePoints || 0;
    }

    /**
     * Redeem points from the global pool. 
     * Strategy: Deduct from brands starting with the oldest account or largest balance.
     */
    async redeemGlobalPoints(
        customerPhone: string,
        targetBrandId: string,
        pointsCost: number,
        description: string
    ) {
        const members = await (unisolatedPrisma as any).loyaltyMember.findMany({
            where: { customerPhone },
            orderBy: { availablePoints: 'desc' } // Prioritize brands with higher balance
        });

        const globalBalance = members.reduce((sum: number, m: any) => sum + (m.availablePoints || 0), 0);
        if (globalBalance < pointsCost) throw new Error('Insufficient global points');

        let remainingToDeduct = pointsCost;

        for (const member of members) {
            if (remainingToDeduct <= 0) break;

            const canDeductFromThisMember = Math.min(member.availablePoints, remainingToDeduct);
            if (canDeductFromThisMember > 0) {
                await this.redeemPoints(member.id, canDeductFromThisMember, `${description} (Global Redemption for ${targetBrandId})`);
                remainingToDeduct -= canDeductFromThisMember;
            }
        }

        return { success: true, pointsRedeemed: pointsCost };
    }

    /**
     * Get member stats for a brand
     */
    async getMemberStats(brandId: string) {
        const [totalMembers, activeMembers, pointStats, tierResults] = await Promise.all([
            (unisolatedPrisma as any).loyaltyMember.count({ where: { brandId } }),
            (unisolatedPrisma as any).loyaltyMember.count({
                where: {
                    brandId,
                    isActive: true,
                    lastOrderDate: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            (unisolatedPrisma as any).loyaltyMember.aggregate({
                where: { brandId },
                _sum: {
                    availablePoints: true,
                    lifetimePoints: true
                }
            }),
            (unisolatedPrisma as any).loyaltyMember.groupBy({
                by: ['tier'],
                where: { brandId },
                _count: {
                    id: true
                }
            })
        ]);

        const tierCounts: Record<string, number> = {};
        tierResults.forEach((res: any) => {
            tierCounts[res.tier] = res._count.id;
        });

        return {
            totalMembers,
            activeMembers,
            totalPointsAvailable: pointStats._sum.availablePoints || 0,
            totalPointsIssued: pointStats._sum.lifetimePoints || 0,
            tierCounts
        };
    }
}

export const loyaltyEngine = new LoyaltyEngine();
