import { prisma } from '@/lib/prisma';

export class LoyaltyService {

    // Calculate and add points for an order
    async addPointsForOrder(orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { brand: true }
        });

        if (!order || !order.customerPhone) return;

        // Rule: 1 Point per Rp 10,000 spent
        const grandTotal = Number(order.grandTotal || 0);
        const pointsEarned = Math.floor(grandTotal / 10000);

        if (pointsEarned <= 0) return;

        // Get or Create Loyalty Account
        // Try to find by phone
        let account = await prisma.loyaltyAccount.findFirst({
            where: {
                customerPhone: order.customerPhone,
                brandId: order.brandId!
            }
        });

        if (!account) {
            account = await prisma.loyaltyAccount.create({
                data: {
                    customerPhone: order.customerPhone,
                    brandId: order.brandId!,
                    totalPoints: 0, // Using virtual field or calculated? 
                    // Schema has 'balance', 'lifetimeEarned', 'lifetimeRedeemed'
                    // We should use those.
                    balance: 0,
                    lifetimeEarned: 0,
                    tier: 'BRONZE'
                }
            });
        }

        // Add Points Transaction
        // We need to create a LoyaltyTransaction
        await prisma.loyaltyTransaction.create({
            data: {
                accountId: account.id,
                amount: pointsEarned,
                type: 'EARN', // Using string or Enum? Existing file had Enum. Let's use string if schema allows or map to Enum.
                // Schema had 'type String'.
                referenceId: orderId,
                description: `Reward for Order #${order.invoiceNo || order.id?.substring(0, 8)}`
            }
        });

        // Update Account
        await prisma.loyaltyAccount.update({
            where: { id: account.id },
            data: {
                balance: { increment: pointsEarned },
                lifetimeEarned: { increment: pointsEarned },
                updatedAt: new Date()
            }
        });

        // Check Tier Upgrade
        await this.checkTierUpgrade(account.id);

        return { earned: pointsEarned, balance: account.balance + pointsEarned };
    }

    async checkTierUpgrade(accountId: string) {
        const account = await prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
        if (!account) return;

        let newTier = 'BRONZE';
        if (account.lifetimeEarned >= 10000) newTier = 'PLATINUM'; // 100jt spend (1pt = 10k)
        else if (account.lifetimeEarned >= 5000) newTier = 'GOLD'; // 50jt spend
        else if (account.lifetimeEarned >= 1000) newTier = 'SILVER'; // 10jt spend

        if (newTier !== account.tier) {
            await prisma.loyaltyAccount.update({
                where: { id: accountId },
                data: { tier: newTier }
            });
            // Should send notification here
        }
    }

    async getAccount(customerPhone: string, brandId: string) {
        return await prisma.loyaltyAccount.findFirst({
            where: { customerPhone, brandId },
            include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } }
        });
    }

    async redeemPoints(customerPhone: string, brandId: string, pointsToRedeem: number, description: string) {
        const account = await this.getAccount(customerPhone, brandId);
        if (!account) throw new Error("Account not found");
        if (account.balance < pointsToRedeem) throw new Error("Insufficient balance");

        // Transaction
        await prisma.loyaltyTransaction.create({
            data: {
                accountId: account.id,
                amount: -pointsToRedeem,
                type: 'REDEEM',
                description: description || 'Redemption'
            }
        });

        // Update Balance
        await prisma.loyaltyAccount.update({
            where: { id: account.id },
            data: {
                balance: { decrement: pointsToRedeem },
                lifetimeRedeemed: { increment: pointsToRedeem }
            }
        });

        return { success: true };
    }
}
