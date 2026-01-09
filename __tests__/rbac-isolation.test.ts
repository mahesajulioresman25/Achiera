// ACHIERA Platform - RBAC & Brand Isolation Tests
// Critical security tests

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { requireAccess, AccessDeniedError } from '@/lib/auth/requireAccess';
import { BrandIsolationError } from '@/lib/auth/brandIsolation';

describe('RBAC & Brand Isolation', () => {
    let brandA: string;
    let brandB: string;
    let ownerUser: string;
    let brandAAdmin: string;
    let brandBAdmin: string;

    beforeAll(async () => {
        // Create test brands
        const b1 = await prisma.brand.create({
            data: { slug: `test-brand-a-${Date.now()}`, name: 'Brand A', isActive: true }
        });
        const b2 = await prisma.brand.create({
            data: { slug: `test-brand-b-${Date.now()}`, name: 'Brand B', isActive: true }
        });
        brandA = b1.id;
        brandB = b2.id;

        // Create test users
        const owner = await prisma.user.create({
            data: {
                email: `owner-${Date.now()}@test.com`,
                name: 'Platform Owner',
                role: 'PLATFORM_OWNER'
            }
        });
        ownerUser = owner.id;

        const adminA = await prisma.user.create({
            data: {
                email: `admin-a-${Date.now()}@test.com`,
                name: 'Brand A Admin',
                role: 'BRAND_ADMIN',
                brandId: brandA
            }
        });
        brandAAdmin = adminA.id;

        const adminB = await prisma.user.create({
            data: {
                email: `admin-b-${Date.now()}@test.com`,
                name: 'Brand B Admin',
                role: 'BRAND_ADMIN',
                brandId: brandB
            }
        });
        brandBAdmin = adminB.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({
            where: { id: { in: [ownerUser, brandAAdmin, brandBAdmin] } }
        });
        await prisma.brand.deleteMany({
            where: { id: { in: [brandA, brandB] } }
        });
    });

    describe('RBAC Permission Checks', () => {
        it('should allow platform owner all permissions', async () => {
            const context = await requireAccess(ownerUser, {
                permission: 'order:create',
                brandId: brandA
            });

            expect(context.userId).toBe(ownerUser);
            expect(context.role).toBe('PLATFORM_OWNER');
        });

        it('should allow brand admin to create orders in their brand', async () => {
            const context = await requireAccess(brandAAdmin, {
                permission: 'order:create',
                brandId: brandA
            });

            expect(context.userId).toBe(brandAAdmin);
            expect(context.brandId).toBe(brandA);
        });

        it('should deny brand admin access to other brands', async () => {
            await expect(
                requireAccess(brandAAdmin, {
                    permission: 'order:create',
                    brandId: brandB
                })
            ).rejects.toThrow(AccessDeniedError);
        });

        it('should deny insufficient permissions', async () => {
            await expect(
                requireAccess(brandAAdmin, {
                    permission: 'brand:delete', // Only owner can delete brands
                    brandId: brandA
                })
            ).rejects.toThrow(AccessDeniedError);
        });

        it('should allow platform owner cross-brand access', async () => {
            const contextA = await requireAccess(ownerUser, {
                permission: 'order:read',
                brandId: brandA
            });
            const contextB = await requireAccess(ownerUser, {
                permission: 'order:read',
                brandId: brandB
            });

            expect(contextA.role).toBe('PLATFORM_OWNER');
            expect(contextB.role).toBe('PLATFORM_OWNER');
        });
    });

    describe('Brand Isolation', () => {
        it('should prevent cross-brand data access via query', async () => {
            // Create order in Brand A
            const order = await prisma.order.create({
                data: {
                    brandId: brandA,
                    userId: brandAAdmin,
                    orderNumber: 'TEST-001',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            // Try to query without brandId (should fail with middleware)
            await expect(
                prisma.order.findUnique({
                    where: { id: order.id }
                    // Missing brandId in where clause
                })
            ).rejects.toThrow(BrandIsolationError);

            // Cleanup
            await prisma.order.delete({
                where: { id: order.id, brandId: brandA }
            });
        });

        it('should require brandId for create operations', async () => {
            await expect(
                prisma.order.create({
                    data: {
                        // Missing brandId
                        userId: brandAAdmin,
                        orderNumber: 'TEST-002',
                        total: 100000,
                        paymentMethod: 'cash',
                        status: 'PENDING',
                        paymentStatus: 'UNPAID'
                    }
                })
            ).rejects.toThrow(BrandIsolationError);
        });

        it('should require brandId for update operations', async () => {
            const order = await prisma.order.create({
                data: {
                    brandId: brandA,
                    userId: brandAAdmin,
                    orderNumber: 'TEST-003',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            await expect(
                prisma.order.update({
                    where: { id: order.id }, // Missing brandId
                    data: { status: 'PROCESSING' }
                })
            ).rejects.toThrow(BrandIsolationError);

            // Cleanup
            await prisma.order.delete({
                where: { id: order.id, brandId: brandA }
            });
        });

        it('should require brandId for delete operations', async () => {
            const order = await prisma.order.create({
                data: {
                    brandId: brandA,
                    userId: brandAAdmin,
                    orderNumber: 'TEST-004',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            await expect(
                prisma.order.delete({
                    where: { id: order.id } // Missing brandId
                })
            ).rejects.toThrow(BrandIsolationError);

            // Cleanup with correct brandId
            await prisma.order.delete({
                where: { id: order.id, brandId: brandA }
            });
        });

        it('should allow queries with correct brandId', async () => {
            const order = await prisma.order.create({
                data: {
                    brandId: brandA,
                    userId: brandAAdmin,
                    orderNumber: 'TEST-005',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            // This should work
            const found = await prisma.order.findUnique({
                where: { id: order.id, brandId: brandA }
            });

            expect(found).toBeTruthy();
            expect(found?.brandId).toBe(brandA);

            // Cleanup
            await prisma.order.delete({
                where: { id: order.id, brandId: brandA }
            });
        });

        it('should prevent Brand A user from accessing Brand B data', async () => {
            // Create order in Brand B
            const orderB = await prisma.order.create({
                data: {
                    brandId: brandB,
                    userId: brandBAdmin,
                    orderNumber: 'TEST-006',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            // Brand A admin tries to access Brand B order
            const found = await prisma.order.findUnique({
                where: { id: orderB.id, brandId: brandA } // Wrong brandId
            });

            expect(found).toBeNull(); // Should not find it

            // Cleanup
            await prisma.order.delete({
                where: { id: orderB.id, brandId: brandB }
            });
        });
    });

    describe('Role-Permission Matrix', () => {
        it('BRAND_FINANCE can approve refunds', async () => {
            const financeUser = await prisma.user.create({
                data: {
                    email: `finance-${Date.now()}@test.com`,
                    name: 'Finance User',
                    role: 'BRAND_FINANCE',
                    brandId: brandA
                }
            });

            const context = await requireAccess(financeUser.id, {
                permission: 'refund:approve',
                brandId: brandA
            });

            expect(context.role).toBe('BRAND_FINANCE');

            await prisma.user.delete({ where: { id: financeUser.id } });
        });

        it('BRAND_WAREHOUSE cannot approve refunds', async () => {
            const warehouseUser = await prisma.user.create({
                data: {
                    email: `warehouse-${Date.now()}@test.com`,
                    name: 'Warehouse User',
                    role: 'BRAND_WAREHOUSE',
                    brandId: brandA
                }
            });

            await expect(
                requireAccess(warehouseUser.id, {
                    permission: 'refund:approve',
                    brandId: brandA
                })
            ).rejects.toThrow(AccessDeniedError);

            await prisma.user.delete({ where: { id: warehouseUser.id } });
        });

        it('BRAND_SALES can create orders but not delete', async () => {
            const salesUser = await prisma.user.create({
                data: {
                    email: `sales-${Date.now()}@test.com`,
                    name: 'Sales User',
                    role: 'BRAND_SALES',
                    brandId: brandA
                }
            });

            // Can create
            const createContext = await requireAccess(salesUser.id, {
                permission: 'order:create',
                brandId: brandA
            });
            expect(createContext.role).toBe('BRAND_SALES');

            // Cannot delete
            await expect(
                requireAccess(salesUser.id, {
                    permission: 'order:delete',
                    brandId: brandA
                })
            ).rejects.toThrow(AccessDeniedError);

            await prisma.user.delete({ where: { id: salesUser.id } });
        });
    });
});
