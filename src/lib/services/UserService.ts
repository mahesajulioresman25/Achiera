import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { GlobalRole, BrandRole } from '@prisma/client';

export class UserService {
    /**
     * Get all users with their brand roles
     */
    static async getAllUsers() {
        return await prisma.user.findMany({
            include: {
                brandRoles: {
                    include: {
                        brand: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a single user by ID
     */
    static async getUserById(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                brandRoles: {
                    include: {
                        brand: true
                    }
                }
            }
        });
    }

    /**
     * Create a new user
     */
    static async createUser(data: {
        name: string;
        email: string;
        passwordHash: string;
        globalRole: GlobalRole;
    }) {
        return await prisma.user.create({
            data
        });
    }

    /**
     * Update user's global profile
     */
    static async updateUserProfile(userId: string, data: {
        name?: string;
        email?: string;
        globalRole?: GlobalRole;
    }) {
        return await prisma.user.update({
            where: { id: userId },
            data
        });
    }

    /**
     * Assign user to a brand with a specific role
     */
    static async assignBrandRole(userId: string, brandId: string, role: BrandRole) {
        return await prisma.userBrandRole.upsert({
            where: {
                userId_brandId: {
                    userId,
                    brandId
                }
            },
            create: {
                userId,
                brandId,
                role
            },
            update: {
                role
            }
        });
    }

    /**
     * Remove user from a brand
     */
    static async removeBrandRole(userId: string, brandId: string) {
        return await prisma.userBrandRole.delete({
            where: {
                userId_brandId: {
                    userId,
                    brandId
                }
            }
        });
    }

    /**
     * Delete a user (Cascades to brandRoles)
     */
    static async deleteUser(userId: string) {
        return await prisma.user.delete({
            where: { id: userId }
        });
    }
}
