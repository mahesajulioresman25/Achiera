'use server';

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProductReviewsAction(brandId: string, productName: string) {
    try {
        const reviews = await (prisma as any).customerReview.findMany({
            where: {
                brandId,
                productName,
                // We show website reviews and maybe some curated external ones
                OR: [
                    { platform: 'WEBSITE' },
                    { platform: 'CURATED' }
                ]
            },
            orderBy: {
                reviewDate: 'desc'
            },
            take: 10
        });

        return { success: true, data: reviews };
    } catch (error) {
        console.error('[getProductReviewsAction] Error:', error);
        return { success: false, error: 'Gagal memuat ulasan' };
    }
}

export async function addProductReviewAction(data: {
    brandId: string,
    productName: string,
    rating: number,
    reviewText: string,
    customerName: string
}) {
    try {
        await (prisma as any).customerReview.create({
            data: {
                brandId: data.brandId,
                platform: 'WEBSITE',
                productName: data.productName,
                rating: data.rating,
                reviewText: data.reviewText,
                customerName: data.customerName,
                reviewDate: new Date(),
                sentiment: data.rating >= 4 ? 'POSITIVE' : 'NEUTRAL'
            }
        });

        revalidatePath('/rasa-ibu/products');
        return { success: true };
    } catch (error) {
        console.error('[addProductReviewAction] Error:', error);
        return { success: false, error: 'Gagal mengirim ulasan' };
    }
}
