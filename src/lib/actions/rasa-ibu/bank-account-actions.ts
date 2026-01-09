'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get Bank Accounts for a Brand
 * Also includes global accounts (where brandId is NULL)
 */
export async function getBrandBankAccountsAction(brandId: string) {
    try {
        const accounts = await prisma.bankAccount.findMany({
            where: {
                OR: [
                    { brandId: brandId },
                    { brandId: null }
                ],
                isActive: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Parse JSON fields if any (currently none, but good practice)
        return { success: true, data: JSON.parse(JSON.stringify(accounts)) };
    } catch (error: any) {
        console.error('Error fetching bank accounts:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create or Update Bank Account
 */
export async function upsertBankAccountAction(data: {
    id?: string;
    brandId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive?: boolean;
}) {
    try {
        const { id, brandId, bankName, accountNumber, accountHolder, isActive } = data;

        if (id) {
            // Update
            await prisma.bankAccount.update({
                where: { id },
                data: {
                    bankName,
                    accountNumber,
                    accountHolder,
                    isActive: isActive ?? true
                }
            });
        } else {
            // Create
            await prisma.bankAccount.create({
                data: {
                    brandId, // Link to specific brand
                    bankName,
                    accountNumber,
                    accountHolder,
                    isActive: isActive ?? true
                }
            });
        }

        revalidatePath('/dashboard/rasa-ibu');
        revalidatePath('/order/track/[id]', 'page'); // Revalidate tracking page too

        return { success: true };
    } catch (error: any) {
        console.error('Error saving bank account:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete (Soft Delete or Hard Delete) Bank Account
 */
export async function deleteBankAccountAction(id: string) {
    try {
        // Hard delete for now as requested for configuration
        await prisma.bankAccount.delete({
            where: { id }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting bank account:', error);
        return { success: false, error: error.message };
    }
}
