'use server';

import {
    getBusinessAnalysis as getAnalysisEngine,
    getBundleRecommendations as getBundleRecommendationsEngine,
    getRFMSegmentation as getRFMSegmentationEngine,
    getCampaignROI as getCampaignROIEngine,
    getCustomerLTV as getCustomerLTVEngine,
    getMarketplacePerformance as getMarketplacePerformanceEngine,
    getProductionPlan as getProductionPlanEngine,
    getWhatsAppPulse as getWhatsAppPulseEngine,
    getRecipeCostingData as getRecipeCostingEngine
} from '@/lib/intelligence/financeEngine';
import {
    calculateDynamicPricing as calculatePricingEngine,
    applyPriceAdjustment as applyAdjustmentEngine
} from '@/lib/intelligence/pricingEngine';
import { prisma } from '@/lib/prisma';
import { LoyaltyService } from '@/lib/services/LoyaltyService';

export async function getBusinessAnalysis(brandId: string) {
    const analysis = await getAnalysisEngine(brandId);
    return JSON.parse(JSON.stringify(analysis));
}
// ... existing exports ...

export async function createWhatsAppCampaignAction(data: {
    brandId: string;
    name: string;
    targetSegment: string;
    messageTemplate: string;
}) {
    try {
        // 1. Create Campaign
        const campaign = await prisma.whatsAppCampaign.create({
            data: {
                brandId: data.brandId,
                name: data.name,
                targetSegment: data.targetSegment,
                messageTemplate: data.messageTemplate,
                status: 'READY'
            }
        });

        // 2. Get Targets based on Segment
        let targets = [];
        if (data.targetSegment === 'ALL') {
            // Get all customers (simplified strategy: unique phones from orders)
            // In reality, this might be expensive. limit to recent.
            const orders = await prisma.order.findMany({
                where: { brandId: data.brandId, customerPhone: { not: null } },
                select: { customerName: true, customerPhone: true },
                distinct: ['customerPhone']
            });
            targets = orders.map((o: any) => ({
                id: o.customerPhone!,
                name: o.customerName
            }));
        } else {
            // Use RFM Segmentation
            const rfm: any = await getRFMSegmentationEngine(data.brandId);
            // Filter logic (mapping RFM segments to simplified targetSegment)
            // "AT_RISK" -> 'Sleeping', 'At Risk', 'Lost' ?
            // "VIP" -> 'Champions', 'Loyal', 'Promising'
            // "NEW" -> 'New Customers', 'Potential Loyalist'

            targets = rfm.topCustomers.filter((cust: any) => {
                const seg = cust.segment?.name || '';
                if (data.targetSegment === 'AT_RISK')
                    return ['At Risk', 'Hibernating', 'About To Sleep'].includes(seg);
                if (data.targetSegment === 'VIP')
                    return ['Champions', 'Loyal Customers'].includes(seg);
                if (data.targetSegment === 'NEW')
                    return ['New Customers', 'Promising'].includes(seg);
                return false;
            });
        }

        // 3. Create Recipients
        let recipientCount = 0;
        for (const target of targets) {
            if (!target.id || target.id.length < 8) continue; // Basic phone validation

            const message = data.messageTemplate
                .replace('{{name}}', target.name || 'Bunda');

            await prisma.whatsAppRecipient.create({
                data: {
                    campaignId: campaign.id,
                    phone: target.id,
                    name: target.name || 'Pelanggan',
                    message
                }
            });
            recipientCount++;
        }

        // 4. Update Campaign Count
        await prisma.whatsAppCampaign.update({
            where: { id: campaign.id },
            data: { totalRecipients: recipientCount }
        });

        return { success: true, count: recipientCount };
    } catch (error: any) {
        console.error('Create Campaign Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getWhatsAppCampaignsAction(brandId: string) {
    try {
        const campaigns = await prisma.whatsAppCampaign.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            include: { recipients: { take: 5 } } // Preview
        });
        return { success: true, data: JSON.parse(JSON.stringify(campaigns)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCampaignRecipientsAction(campaignId: string) {
    try {
        const recipients = await prisma.whatsAppRecipient.findMany({
            where: { campaignId }
        });
        return { success: true, data: JSON.parse(JSON.stringify(recipients)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { getPlatformSettingsAction } from './finance';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';

export async function getLoyaltyStatsAction(data: { customerPhone: string; brandId: string }) {
    try {
        const [member, settingsRes] = await Promise.all([
            loyaltyEngine.getMemberByPhone(data.brandId, data.customerPhone),
            getPlatformSettingsAction(data.brandId)
        ]);

        return {
            success: true,
            data: JSON.parse(JSON.stringify(member)),
            config: settingsRes.success ? settingsRes.settings.loyalty : null
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function redeemLoyaltyPointsAction(data: {
    customerPhone: string;
    brandId: string;
    points: number;
    description: string;
}) {
    try {
        const member = await loyaltyEngine.getMemberByPhone(data.brandId, data.customerPhone);
        if (!member) throw new Error('Member not found');

        await loyaltyEngine.redeemPoints(member.id, data.points, data.description);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBundleAdvisorAction(brandId: string) {
    try {
        const recommendations = await getBundleRecommendationsEngine(brandId);
        return { success: true, data: JSON.parse(JSON.stringify(recommendations)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getRFMSegmentationAction(brandId: string) {
    try {
        const segmentation = await getRFMSegmentationEngine(brandId);
        return JSON.parse(JSON.stringify(segmentation));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCampaignROIAction(brandId: string) {
    try {
        const stats = await getCampaignROIEngine(brandId);
        return JSON.parse(JSON.stringify(stats));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCustomerLTVAction(brandId: string) {
    try {
        const stats = await getCustomerLTVEngine(brandId);
        return JSON.parse(JSON.stringify(stats));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function getMarketplacePerformanceAction(brandId: string) {
    try {
        const stats = await getMarketplacePerformanceEngine(brandId);
        return JSON.parse(JSON.stringify(stats));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getProductionPlanAction(brandId: string) {
    try {
        const plan = await getProductionPlanEngine(brandId);
        return JSON.parse(JSON.stringify(plan));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPublicBrandConfigAction(slug: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug },
            select: { id: true, paymentSettings: true }
        });
        const settings = brand?.paymentSettings as any;
        return {
            success: true,
            data: {
                id: brand?.id,
                whatsapp: settings?.whatsappCrm || '628123456789',
                qrisEnabled: settings?.qrisEnabled || false,
                qrisImageUrl: settings?.qrisImageUrl || null,
                loyalty: settings?.loyalty || { pointValueInRupiah: 100 }
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWhatsAppPulseAction(brandId: string) {
    try {
        const pulse = await getWhatsAppPulseEngine(brandId);
        return JSON.parse(JSON.stringify(pulse));
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function getRecipeCostingAction(brandId: string) {
    try {
        const stats = await getRecipeCostingEngine(brandId);
        return JSON.parse(JSON.stringify(stats));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function calculateDynamicPricing(brandId: string) {
    try {
        const pricing = await calculatePricingEngine(brandId);
        return JSON.parse(JSON.stringify(pricing));
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function applyPriceAdjustment(variantId: string, newPrice: number) {
    try {
        const res = await applyAdjustmentEngine(variantId, newPrice);
        return res;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
