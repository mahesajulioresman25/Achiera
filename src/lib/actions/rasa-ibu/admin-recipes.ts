'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleRecipePublish(brandId: string, recipeId: string, isPublished: boolean) {
    try {
        await (prisma as any).recipePost.update({
            where: { id: recipeId, brandId },
            data: { isPublished }
        });
        revalidatePath('/dashboard/recipes');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function approveRecipeComment(recipeId: string, commentId: string) {
    try {
        await (prisma as any).recipeComment.update({
            where: { id: commentId, recipeId },
            data: { isApproved: true }
        });
        revalidatePath('/dashboard/recipes');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteRecipeComment(recipeId: string, commentId: string) {
    try {
        await (prisma as any).recipeComment.delete({
            where: { id: commentId, recipeId }
        });
        revalidatePath('/dashboard/recipes');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteRecipePost(brandId: string, recipeId: string) {
    try {
        await (prisma as any).recipePost.delete({
            where: { id: recipeId, brandId }
        });
        revalidatePath('/dashboard/recipes');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
