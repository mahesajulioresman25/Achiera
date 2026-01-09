'use server';

import { UserService } from '@/lib/services/UserService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { GlobalRole, BrandRole } from '@prisma/client';

/**
 * Helper to ensure only OWNER can perform these actions
 */
async function ensureOwner() {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.globalRole !== 'OWNER') {
        throw new Error('Unauthorized: Only OWNER can manage users');
    }
    return session;
}

export async function getUsersAction() {
    await ensureOwner();
    try {
        const users = await UserService.getAllUsers();
        return { success: true, data: JSON.parse(JSON.stringify(users)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createUserAction(formData: {
    name: string;
    email: string;
    password: string;
    globalRole: GlobalRole;
}) {
    await ensureOwner();
    try {
        const passwordHash = await bcrypt.hash(formData.password, 10);
        await UserService.createUser({
            name: formData.name,
            email: formData.email,
            passwordHash,
            globalRole: formData.globalRole
        });
        revalidatePath('/dashboard/achiera/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserAction(userId: string, data: {
    name?: string;
    email?: string;
    globalRole?: GlobalRole;
}) {
    await ensureOwner();
    try {
        await UserService.updateUserProfile(userId, data);
        revalidatePath('/dashboard/achiera/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignBrandRoleAction(userId: string, brandId: string, role: BrandRole) {
    await ensureOwner();
    try {
        await UserService.assignBrandRole(userId, brandId, role);
        revalidatePath('/dashboard/achiera/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeBrandRoleAction(userId: string, brandId: string) {
    await ensureOwner();
    try {
        await UserService.removeBrandRole(userId, brandId);
        revalidatePath('/dashboard/achiera/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteUserAction(userId: string) {
    await ensureOwner();
    try {
        await UserService.deleteUser(userId);
        revalidatePath('/dashboard/achiera/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
