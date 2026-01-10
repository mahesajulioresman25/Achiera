import { PrismaClient } from '@prisma/client';
import { brandIsolationExtension } from './auth/brandIsolation';

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: ['query', 'error', 'info', 'warn'],
    });

    // Only apply extension on the server side to prevent browser bundling issues
    if (typeof window === 'undefined') {
        return client.$extends(brandIsolationExtension);
    }

    return client as any;
};

// Define the stable extended type for the entire application
// We use 'any' as a fallback to prevent "Excessive stack depth" in complex environments
// while still providing better-than-nothing types for the models.
export type ExtendedPrismaClient = any;

const globalForPrisma = globalThis as unknown as {
    prisma: ExtendedPrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

export const prisma: ExtendedPrismaClient = basePrisma;

/**
 * Unisolated Prisma client for global/executive operations (OWNER level only)
 * Use with extreme caution as it bypasses brand isolation.
 */
export const unisolatedPrisma = new PrismaClient({
    log: ['error', 'warn'],
});
