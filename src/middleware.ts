import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthPage = request.nextUrl.pathname.startsWith('/login');
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

    // Redirect to login if accessing dashboard without auth
    if (isDashboard) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // BLOCK 'USER' ROLE FROM DASHBOARD
        // Customers/Subscribers should never see the admin dashboard
        if (token.globalRole === 'USER') {
            return NextResponse.redirect(new URL('/rasa-ibu/profile', request.url));
        }
    }

    // Redirect to dashboard if already logged in and trying to access login
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Brand-specific dashboard access control
    if (isDashboard && token) {
        const pathParts = request.nextUrl.pathname.split('/');

        // If accessing /dashboard/[brandSlug]/...
        if (pathParts.length >= 3 && pathParts[1] === 'dashboard' && pathParts[2]) {
            const brandSlug = pathParts[2];
            const brands = (token.brands as any[]) || [];
            const globalRole = token.globalRole as string;

            // OWNER always has access, or check specific brand roles for others
            const hasAccess = globalRole === 'OWNER' || brands.some((br: any) => br.brandSlug === brandSlug);

            if (!hasAccess) {
                // Redirect to first brand they have access to
                if (brands.length > 0) {
                    return NextResponse.redirect(
                        new URL(`/dashboard/${brands[0].brandSlug}`, request.url)
                    );
                }
                // No brand access at all - redirect to login
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }
    }

    // --- SECURITY HEADERS & API PROTECTION ---

    // 1. Protect all /api/ routes (except auth and public)
    const isApiRequest = request.nextUrl.pathname.startsWith('/api');
    const isPublicApi = request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/api/public');

    if (isApiRequest && !isPublicApi && !token) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication required' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }

    // 2. Add Security Headers
    const response = NextResponse.next();

    // CSP - Content Security Policy (Adjust based on external sources used)
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.google-analytics.com https://*.googletagmanager.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https:;
        font-src 'self' https://fonts.gstatic.com data:;
        connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
        frame-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/api/((?!debug-env).*)'  // Exclude /api/debug-env from auth
    ],
};
