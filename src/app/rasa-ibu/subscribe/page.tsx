import React from 'react';
import { prisma } from '@/lib/prisma';
import SubscribeAuthWrapper from './SubscribeAuthWrapper';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Ensure fresh data on every request

export default async function SubscribePage() {
    // 1. Get Session
    const session = await auth();

    // 2. Fetch Brand & Plans
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: {
            subscriptionPlans: {
                where: { isActive: true },
                include: {
                    planProducts: {
                        include: {
                            variant: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                },
                orderBy: { price: 'asc' }
            },
            bankAccounts: {
                where: { isActive: true }
            }
        }
    });

    const plans = (brand?.subscriptionPlans || []).map((plan: any) => ({
        ...plan,
        price: Number(plan.price),
        planProducts: plan.planProducts.map((pp: any) => ({
            ...pp,
            subscriptionPrice: Number(pp.subscriptionPrice),
            variant: pp.variant ? {
                ...pp.variant,
                price: Number(pp.variant.price),
                costPrice: pp.variant.costPrice ? Number(pp.variant.costPrice) : null,
                weight: pp.variant.weight ? Number(pp.variant.weight) : null,
                operationalCostPerUnit: pp.variant.operationalCostPerUnit ? Number(pp.variant.operationalCostPerUnit) : null,
                marketplaceFeeRate: pp.variant.marketplaceFeeRate ? Number(pp.variant.marketplaceFeeRate) : null,
                targetMargin: pp.variant.targetMargin ? Number(pp.variant.targetMargin) : null,
                sellingPrice: pp.variant.sellingPrice ? Number(pp.variant.sellingPrice) : null
            } : null
        }))
    }));

    // 3. Fetch Existing Subscription Data (if user logged in)
    let existingData = null;
    if (session?.user?.id) {
        // First try to get from latest subscription (most recent address)
        const latestSub = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                brandId: brand?.id
            },
            orderBy: { createdAt: 'desc' }
        });

        if (latestSub) {
            existingData = {
                name: latestSub.customerName,
                phone: latestSub.customerPhone,
                address: latestSub.customerAddress
            };
        } else {
            // Fallback to User Profile
            const userProfile = await prisma.user.findUnique({
                where: { id: session.user.id }
            });

            if (userProfile) {
                existingData = {
                    name: userProfile.name,
                    phone: userProfile.phone, // This now fetches the "Nomor WhatsApp" from profile
                    address: userProfile.address
                };
            }
        }
    }

    // 4. Pass to Client Wrapper (Auth Check)
    return <SubscribeAuthWrapper
        plans={plans}
        existingData={existingData}
        bankAccounts={brand?.bankAccounts || []}
        paymentSettings={brand?.paymentSettings || {}}
    />;
}
