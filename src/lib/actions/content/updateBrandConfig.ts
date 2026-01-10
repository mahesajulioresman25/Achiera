'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface UpdateBrandConfigPayload {
    publicTitle?: string;
    publicSubtitle?: string;
    heroTagline?: string;
    heroImage?: string;
    heroCtaPrimary?: string;
    heroCtaPrimaryLink?: string;
    heroCtaSecondary?: string;
    heroCtaSecondaryLink?: string;

    philosophyTagline?: string;
    philosophyTitle?: string;
    philosophyContent?: string;
    philosophyImage?: string;
    philosophyLinkText?: string;
    philosophyLinkUrl?: string;

    featuredTagline?: string;
    featuredSectionTitle?: string;
    featuredSectionSubtitle?: string;

    platformTagline?: string;
    platformSectionTitle?: string;
    platformSectionSubtitle?: string;
    platformLinks?: {
        shopee?: string;
        grab?: string;
        gofood?: string;
        tokopedia?: string;
        [key: string]: any;
    };

    ctaTagline?: string;
    ctaSectionTitle?: string;
    ctaSectionSubtitle?: string;
    ctaButtonText?: string;
    aboutImage?: string;

    // Subscription Section
    subscriptionTagline?: string;
    subscriptionTitle?: string;
    subscriptionSubtitle?: string;
    subscriptionDescription?: string;
    subscriptionBenefits?: { title: string; desc: string }[];
    subscriptionButtonText?: string;
    subscriptionImage?: string;

    // 6. How To Order (Steps & Info)
    howToOrderHeroTitle?: string;
    howToOrderHeroSubtitle?: string;
    howToOrderSteps?: string[];
    howToOrderInfoTitle?: string;
    howToOrderInfoList?: string[];
    howToOrderInfoImage?: string;
    howToOrderCtaTitle?: string;
    howToOrderCtaPrimary?: string;
    howToOrderCtaPrimaryLink?: string;
    howToOrderCtaSecondary?: string;

    // 7. About Page
    aboutHeroTitle?: string;
    aboutHeroSubtitle?: string;
    aboutStoryTitle?: string;
    aboutStoryContent?: string[];
    aboutStoryImage?: string;
    aboutValuesTitle?: string;
    aboutValuesList?: { title: string; desc: string }[];
    aboutCtaTitle?: string;
    aboutCtaContent?: string;
    aboutCtaPrimary?: string;
    aboutCtaPrimaryLink?: string;
    aboutCtaSecondary?: string;
    aboutCtaSecondaryLink?: string;

    // 7. Navigation
    publicNavLinks?: { label: string; href: string }[];

    // 12. Product List Page
    productListHeroTitle?: string;
    productListHeroSubtitle?: string;
    productListHeroTagline?: string;
    productListHeroImage?: string;

    // 9. Social Media
    instagramHandle?: string;
    socialLinks?: any; // Json

    trustBadges?: any; // Json

    // Pricing & Overhead
    defaultOverheadPerUnit?: number;
    targetMonthlyVolume?: number;
    marketplaceFeeRate?: number;
    targetNetMarginRate?: number;
    operationalOverhead?: number;
    overheadBreakdown?: any;
}

export async function updateBrandConfigAction(brandId: string, data: UpdateBrandConfigPayload) {
    try {
        await prisma.brandConfig.upsert({
            where: { brandId: brandId },
            create: {
                brandId: brandId,
                ...data
            },
            update: {
                ...data
            }
        });

        // Revalidate the public page
        revalidatePath('/rasa-ibu'); // TODO: Make this dynamic for other brands if needed
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update brand config:', error);
        return { success: false, error: error.message };
    }
}

export async function getBrandConfigAction(brandId: string) {
    try {
        const config = await prisma.brandConfig.findUnique({
            where: { brandId: brandId }
        });
        return { success: true, data: config };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
