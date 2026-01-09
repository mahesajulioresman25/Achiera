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

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
