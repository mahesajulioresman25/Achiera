import { describe, it, expect } from '@jest/globals';
import { activateKillSwitch, deactivateKillSwitch, checkKillSwitch } from '@/lib/hardening/kill-switch';
import { createCorrelationContext } from '@/lib/hardening/correlation';
import { prisma } from '@/lib/prisma';

// Test Data Factory
class TestDataFactory {
    static async createTestBrand() {
        return prisma.brand.create({
            data: {
                name: 'Test Brand KillSwitch',
                slug: `test-brand-ks-${Date.now()}`,
                isActive: true
            }
        });
    }

    static async createTestUser(brandId: string) {
        return prisma.user.create({
            data: {
                email: `test-ks-${Date.now()}@test.local`,
                name: 'Test User KillSwitch',
                passwordHash: 'hashed_placeholder',
                globalRole: 'USER',
                brandRoles: {
                    create: {
                        brandId,
                        role: 'CONSUMER'
                    }
                }
            }
        });
    }
}

describe('Kill Switch Functionality', () => {
    let testBrand: any;
    let testUser: any;

    beforeAll(async () => {
        testBrand = await TestDataFactory.createTestBrand();
        testUser = await TestDataFactory.createTestUser(testBrand.id);
    });

    afterAll(async () => {
        // Cleanup
        await prisma.killSwitch.deleteMany({ where: { brandId: testBrand.id } }); // If any
        await prisma.userBrandRole.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.deleteMany({ where: { id: testUser.id } });
        await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    });

    it('should activate and deactivate kill switch', async () => {
        const context = createCorrelationContext(
            'TEST',
            testBrand.id,
            testUser.id
        );

        // Test 1: Activate FREEZE_ALL_ORDERS
        await activateKillSwitch(
            context,
            'FREEZE_ALL_ORDERS',
            'Test activation',
            undefined,
            new Date(Date.now() + 60000) // 1 minute
        );

        // Test 2: Check if kill switch is active
        const check1 = await checkKillSwitch('FREEZE_ALL_ORDERS');
        expect(check1.allowed).toBe(false);

        // Test 3: Deactivate kill switch
        const activeSwitch = await prisma.killSwitch.findFirst({
            where: {
                type: 'FREEZE_ALL_ORDERS',
                status: 'ACTIVE'
            }
        });

        if (activeSwitch) {
            await deactivateKillSwitch(context, activeSwitch.id);
        }

        const check2 = await checkKillSwitch('FREEZE_ALL_ORDERS');
        expect(check2.allowed).toBe(true);
    });

    it('should handle brand-specific freeze', async () => {
        const context = createCorrelationContext(
            'TEST',
            testBrand.id,
            testUser.id
        );

        await activateKillSwitch(
            context,
            'FREEZE_BRAND',
            'Test brand freeze',
            testBrand.id,
            new Date(Date.now() + 60000)
        );

        const check3 = await checkKillSwitch('FREEZE_BRAND', testBrand.id);
        expect(check3.allowed).toBe(false);

        // Cleanup
        await prisma.killSwitch.deleteMany({
            where: {
                reason: {
                    startsWith: 'Test'
                }
            }
        });
    });

    it('should handle auto-expiry', async () => {
        const context = createCorrelationContext('TEST', undefined, testUser.id);

        // Activate with 2 second expiry
        await activateKillSwitch(
            context,
            'FREEZE_ALL_ORDERS',
            'Test auto-expiry',
            undefined,
            new Date(Date.now() + 2000) // 2 seconds
        );

        // Check immediately
        const check1 = await checkKillSwitch('FREEZE_ALL_ORDERS');
        expect(check1.allowed).toBe(false);

        // Wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check after expiry
        const check2 = await checkKillSwitch('FREEZE_ALL_ORDERS');
        expect(check2.allowed).toBe(true);

        // Cleanup
        await prisma.killSwitch.deleteMany({
            where: { reason: 'Test auto-expiry' }
        });
    });
});

