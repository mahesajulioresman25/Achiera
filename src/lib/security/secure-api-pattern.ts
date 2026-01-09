// ACHIERA Platform - Secure API Route Pattern
// Template for creating secure API endpoints with RBAC

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requireAccess } from '@/lib/auth/rbac';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BrandRole } from '@prisma/client';

/**
 * Secure API handler wrapper
 */
export function secureAPIRoute<T = any>(config: {
    allowedRoles: BrandRole[];
    requireBrandId?: boolean;
    schema?: z.ZodSchema<T>;
    handler: (params: {
        session: any;
        brandId?: string;
        data?: T;
        request: NextRequest;
    }) => Promise<any>;
}) {
    return async function (request: NextRequest, context?: { params: any }) {
        try {
            // 1. Authentication check
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            // 2. Extract brandId from URL or body
            let brandId: string | undefined;
            if (config.requireBrandId) {
                brandId = context?.params?.brandSlug
                    ? await getBrandIdFromSlug(context.params.brandSlug)
                    : undefined;

                if (!brandId) {
                    return NextResponse.json(
                        { error: 'Brand not found' },
                        { status: 404 }
                    );
                }
            }

            // 3. RBAC check
            if (brandId) {
                try {
                    await requireAccess(brandId, config.allowedRoles);
                } catch (error) {
                    return NextResponse.json(
                        { error: 'Access denied' },
                        { status: 403 }
                    );
                }
            }

            // 4. Validate request body (if schema provided)
            let data: T | undefined;
            if (config.schema && request.method !== 'GET') {
                try {
                    const body = await request.json();
                    data = config.schema.parse(body);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        return NextResponse.json(
                            { error: 'Validation failed', details: error.errors },
                            { status: 400 }
                        );
                    }
                    return NextResponse.json(
                        { error: 'Invalid request body' },
                        { status: 400 }
                    );
                }
            }

            // 5. Execute handler
            const result = await config.handler({
                session,
                brandId,
                data,
                request
            });

            return NextResponse.json(result);

        } catch (error) {
            console.error('API Error:', error);

            // Log error for monitoring
            await logAPIError(error, request);

            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

/**
 * Example: Secure product creation endpoint
 */
const CreateProductSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    categoryId: z.string(),
    price: z.number().positive()
});

export const POST = secureAPIRoute({
    allowedRoles: ['BRAND_ADMIN'],
    requireBrandId: true,
    schema: CreateProductSchema,
    handler: async ({ session, brandId, data }) => {
        // Business logic here
        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: data!.categoryId,
                name: data!.name,
                slug: data!.slug
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                brandId,
                action: 'PRODUCT_CREATE',
                entityType: 'PRODUCT',
                entityId: product.id
            }
        });

        return { product };
    }
});

/**
 * Helper: Get brand ID from slug
 */
async function getBrandIdFromSlug(slug: string): Promise<string | undefined> {
    const brand = await prisma.brand.findUnique({
        where: { slug },
        select: { id: true }
    });
    return brand?.id;
}

/**
 * Log API errors
 */
async function logAPIError(error: any, request: NextRequest) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: null,
                brandId: null,
                action: 'API_ERROR',
                entityType: 'SYSTEM',
                entityId: 'ERROR',
                metadata: {
                    error: error.message,
                    stack: error.stack,
                    path: request.nextUrl.pathname,
                    method: request.method,
                    timestamp: new Date().toISOString()
                }
            }
        });
    } catch (logError) {
        console.error('Failed to log API error:', logError);
    }
}

/**
 * Rate limiting decorator
 */
export function withRateLimit(
    handler: Function,
    limit: number = 100,
    windowMs: number = 60000
) {
    const requests = new Map<string, number[]>();

    return async function (request: NextRequest, ...args: any[]) {
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();

        // Get request timestamps for this IP
        const timestamps = requests.get(ip) || [];

        // Remove old timestamps outside the window
        const recentTimestamps = timestamps.filter(t => now - t < windowMs);

        // Check if limit exceeded
        if (recentTimestamps.length >= limit) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        // Add current timestamp
        recentTimestamps.push(now);
        requests.set(ip, recentTimestamps);

        // Execute handler
        return handler(request, ...args);
    };
}

/**
 * CORS configuration
 */
export function withCORS(handler: Function, allowedOrigins: string[] = []) {
    return async function (request: NextRequest, ...args: any[]) {
        const origin = request.headers.get('origin');

        const response = await handler(request, ...args);

        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        return response;
    };
}
