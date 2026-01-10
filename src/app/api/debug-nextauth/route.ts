import { NextResponse } from 'next/server';

// Server-side diagnostic endpoint to check what NextAuth sees
export async function GET() {
    const authOptions = (await import('@/auth')).authOptions;

    return NextResponse.json({
        providers: authOptions.providers?.map((p: any) => p.id || p.name) || [],
        session_strategy: authOptions.session?.strategy || 'jwt',
        pages: authOptions.pages || {},
        callbacks_defined: {
            jwt: !!authOptions.callbacks?.jwt,
            session: !!authOptions.callbacks?.session,
        },
        env_vars: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
            NODE_ENV: process.env.NODE_ENV,
        }
    });
}
