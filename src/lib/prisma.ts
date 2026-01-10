import { PrismaClient } from '@prisma/client';
import { brandIsolationExtension } from './auth/brandIsolation';

const baseClientSingleton = () => {
    return new PrismaClient({
        log: ['error', 'warn'],
    });
};

/**
 * We use globalThis to maintain a single Prisma instance during development hot reloads.
 * This also ensures only one connection pool is created in serverless environments.
 */
const globalForPrisma = globalThis as unknown as {
    basePrisma: PrismaClient | undefined;
    extendedPrisma: any | undefined;
};

// 1. The base client is our "unisolated" instance
// Force connection_limit=10 if not present to prevent P2024 errors
const getClientWithPoolFix = () => {
    let url = process.env.DATABASE_URL || "";
    if (url && !url.includes("connection_limit")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}connection_limit=10&pool_timeout=20`;
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
        log: ['error', 'warn'],
    });
};

export const unisolatedPrisma = globalForPrisma.basePrisma ?? getClientWithPoolFix();

// 2. The extended client is our "isolated" instance
export const prisma = globalForPrisma.extendedPrisma ?? (
    typeof window === 'undefined'
        ? unisolatedPrisma.$extends(brandIsolationExtension)
        : unisolatedPrisma
);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.basePrisma = unisolatedPrisma;
    globalForPrisma.extendedPrisma = prisma;
}

export type ExtendedPrismaClient = typeof prisma;
