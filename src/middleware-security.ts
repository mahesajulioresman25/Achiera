// ACHIERA Platform - Enhanced Security Middleware
// Server-side RBAC enforcement with role escalation prevention

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { GlobalRole, BrandRole } from '@prisma/client';

const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Security middleware with comprehensive protection
 */
export async function securityMiddleware(request: NextRequest) {
    const response = NextResponse.next();

    // 1. Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // 2. Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${ip}:${request.nextUrl.pathname}`;

    if (!isRateLimitOk(rateLimitKey)) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'Retry-After': '60'
            }
        });
    }

    // 3. CSRF protection for mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');

        if (origin && !isValidOrigin(origin, host)) {
            await logSecurityEvent({
                type: 'CSRF_ATTEMPT',
                ip,
                origin,
                path: request.nextUrl.pathname
            });

            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    // 4. Authentication check for protected routes
    if (isProtectedRoute(request.nextUrl.pathname)) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            await logSecurityEvent({
                type: 'UNAUTHORIZED_ACCESS',
                ip,
                path: request.nextUrl.pathname
            });

            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 5. Brand access verification
        const brandSlug = extractBrandSlug(request.nextUrl.pathname);
        if (brandSlug && brandSlug !== 'owner') {
            const hasAccess = await verifyBrandAccess(
                token.userId as string,
                brandSlug,
                token.globalRole as GlobalRole
            );

            if (!hasAccess) {
                await logSecurityEvent({
                    type: 'UNAUTHORIZED_BRAND_ACCESS',
                    userId: token.userId as string,
                    brandSlug,
                    ip,
                    path: request.nextUrl.pathname
                });

                return new NextResponse('Access Denied', { status: 403 });
            }
        }

        // 6. Owner-only routes
        if (request.nextUrl.pathname.startsWith('/owner')) {
            if (token.globalRole !== 'OWNER') {
                await logSecurityEvent({
                    type: 'OWNER_ROUTE_ACCESS_DENIED',
                    userId: token.userId as string,
                    globalRole: token.globalRole as string,
                    ip,
                    path: request.nextUrl.pathname
                });

                return new NextResponse('Owner Access Required', { status: 403 });
            }
        }
    }

    return response;
}

/**
 * Rate limiting check
 */
function isRateLimitOk(key: string): boolean {
    const now = Date.now();
    const limit = rateLimitStore.get(key);

    if (!limit || now > limit.resetAt) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + 60000 // 1 minute window
        });
        return true;
    }

    if (limit.count >= 100) { // 100 requests per minute
        return false;
    }

    limit.count++;
    return true;
}

/**
 * Validate origin for CSRF protection
 */
function isValidOrigin(origin: string, host: string | null): boolean {
    if (!host) return false;

    const allowedOrigins = [
        `https://${host}`,
        `http://${host}`,
        process.env.NEXTAUTH_URL
    ].filter(Boolean);

    return allowedOrigins.some(allowed => origin.startsWith(allowed as string));
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
    const protectedPrefixes = [
        '/dashboard',
        '/owner',
        '/api/admin',
        '/api/auth/session'
    ];

    return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Extract brand slug from pathname
 */
function extractBrandSlug(pathname: string): string | null {
    const match = pathname.match(/^\/dashboard\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Verify user has access to brand
 */
async function verifyBrandAccess(
    userId: string,
    brandSlug: string,
    globalRole: GlobalRole
): Promise<boolean> {
    // OWNER bypass
    if (globalRole === 'OWNER') {
        return true;
    }

    // Check brand access
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true }
    });

    if (!brand) return false;

    const userRole = await prisma.userBrandRole.findUnique({
        where: {
            userId_brandId: {
                userId,
                brandId: brand.id
            }
        }
    });

    return !!userRole;
}

/**
 * Log security events
 */
async function logSecurityEvent(event: {
    type: string;
    userId?: string;
    brandSlug?: string;
    globalRole?: string;
    ip: string;
    origin?: string;
    path: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: event.userId || null,
                brandId: null,
                action: `SECURITY_${event.type}`,
                entityType: 'SECURITY',
                entityId: 'SYSTEM',
                metadata: {
                    type: event.type,
                    ip: event.ip,
                    path: event.path,
                    origin: event.origin,
                    globalRole: event.globalRole,
                    brandSlug: event.brandSlug,
                    timestamp: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

/**
 * Middleware config
 */
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/owner/:path*',
        '/api/:path*'
    ]
};
