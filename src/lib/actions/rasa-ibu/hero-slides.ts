'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get all hero slides for a brand
 */
export async function getHeroSlides(brandId: string) {
    try {
        const slides = await prisma.heroSlide.findMany({
            where: { brandId },
            orderBy: { sortOrder: 'asc' }
        });
        return { success: true, slides };
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return { success: false, error: 'Failed to fetch hero slides' };
    }
}

/**
 * Create a new hero slide
 */
export async function createHeroSlide(data: {
    brandId: string;
    title: string;
    subtitle: string;
    ctaLabel?: string;
    ctaLink?: string;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl?: string;
    videoUrl?: string;
    tagline?: string; // New
    isActive?: boolean;
}) {
    try {
        // Get the highest sort order
        const maxOrder = await prisma.heroSlide.findFirst({
            where: { brandId: data.brandId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true }
        });

        const slide = await prisma.heroSlide.create({
            data: {
                ...data,
                sortOrder: (maxOrder?.sortOrder || 0) + 1,
                isActive: data.isActive ?? true
            } as any
        });

        revalidatePath('/rasa-ibu');
        return { success: true, slide };
    } catch (error: any) {
        console.error('Error creating hero slide:', error);
        return { success: false, error: 'Gagal membuat slide: ' + (error.message || 'Error unknown') };
    }
}

/**
 * Update a hero slide
 */
export async function updateHeroSlide(id: string, data: {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaLink?: string;
    mediaType?: 'IMAGE' | 'VIDEO';
    imageUrl?: string;
    videoUrl?: string;
    tagline?: string; // New
    isActive?: boolean;
}) {
    try {
        const slide = await prisma.heroSlide.update({
            where: { id },
            data: data as any
        });

        revalidatePath('/rasa-ibu');
        return { success: true, slide };
    } catch (error) {
        console.error('Error updating hero slide:', error);
        return { success: false, error: 'Failed to update hero slide' };
    }
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlide(id: string) {
    try {
        await prisma.heroSlide.delete({
            where: { id }
        });

        revalidatePath('/rasa-ibu');
        return { success: true };
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        return { success: false, error: 'Failed to delete hero slide' };
    }
}

/**
 * Reorder hero slides
 */
export async function reorderHeroSlides(slideIds: string[]) {
    try {
        // Update sort order for each slide
        await Promise.all(
            slideIds.map((id, index) =>
                prisma.heroSlide.update({
                    where: { id },
                    data: { sortOrder: index + 1 }
                })
            )
        );

        revalidatePath('/rasa-ibu');
        return { success: true };
    } catch (error) {
        console.error('Error reordering hero slides:', error);
        return { success: false, error: 'Failed to reorder slides' };
    }
}

/**
 * Toggle hero slide active status
 */
export async function toggleHeroSlideStatus(id: string, isActive: boolean) {
    try {
        const slide = await prisma.heroSlide.update({
            where: { id },
            data: { isActive }
        });

        revalidatePath('/rasa-ibu');
        return { success: true, slide };
    } catch (error) {
        console.error('Error toggling hero slide status:', error);
        return { success: false, error: 'Failed to toggle slide status' };
    }
}
