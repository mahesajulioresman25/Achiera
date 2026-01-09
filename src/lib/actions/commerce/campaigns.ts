'use server';
import { prisma } from '@/lib/prisma';

export async function upsertCampaignAction(data: any, brandIdInput: string) {
    if (!brandIdInput) {
        console.error('[upsertCampaignAction] Error: brandIdInput is missing');
        throw new Error("Missing Brand ID. Silakan segarkan halaman dan coba lagi.");
    }

    const { id, ...rest } = data;

    let brandId = brandIdInput;
    if (!brandId.startsWith('c')) {
        const brand = await prisma.brand.findUnique({ where: { slug: brandIdInput } });
        if (brand) brandId = brand.id;
    }

    // Ensure dates are Date objects and End Date includes the full day
    const startDate = new Date(rest.startDate);
    const endDate = new Date(rest.endDate);
    endDate.setHours(23, 59, 59, 999);

    const payload = {
        ...rest,
        startDate,
        endDate,
        brandId
    };

    try {
        let result;
        if (id) {
            result = await prisma.campaign.update({
                where: { id },
                data: payload,
                include: { bundles: true }
            });
        } else {
            result = await prisma.campaign.create({
                data: payload,
                include: { bundles: true }
            });
        }

        // Serialize decimals/dates for JSON response safety
        return JSON.parse(JSON.stringify(result));
    } catch (error: any) {
        console.error('[upsertCampaignAction] Error:', error);
        throw error;
    }
}

export async function deleteCampaignAction(id: string, brandId: string) {
    try {
        const campaign = await prisma.campaign.findFirst({
            where: { id, brandId }
        });

        if (!campaign) {
            throw new Error("Campaign tidak ditemukan atau Anda tidak memiliki akses.");
        }

        await prisma.campaign.delete({
            where: { id }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[deleteCampaignAction] Error:', error);
        throw new Error(error.message || "Gagal menghapus campaign");
    }
}

export async function getActiveCampaigns(brandId: string) {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: {
                brandId,
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            },
            include: {
                bundles: {
                    include: {
                        items: {
                            include: {
                                variant: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { startDate: 'asc' }
        });

        return JSON.parse(JSON.stringify(campaigns));
    } catch (error) {
        console.error('[getActiveCampaigns] Error:', error);
        return [];
    }
}

export async function getBundleById(bundleId: string) {
    try {
        const bundle = await prisma.productBundle.findUnique({
            where: { id: bundleId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!bundle) return null;

        return JSON.parse(JSON.stringify(bundle));
    } catch (error) {
        console.error('[getBundleById] Error:', error);
        return null;
    }
}
