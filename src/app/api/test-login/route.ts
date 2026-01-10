import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// GET endpoint for easy browser testing
// Usage: /api/test-login?email=xxx&password=xxx
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');

    if (!email || !password) {
        return NextResponse.json({
            error: 'Missing email or password',
            usage: '/api/test-login?email=xxx@xxx.com&password=xxx'
        }, { status: 400 });
    }

    try {
        console.log('[TEST-LOGIN] Testing:', email);

        // Use raw query to bypass brand isolation extension
        const users = await prisma.$queryRaw<any[]>`
            SELECT id, email, name, "passwordHash", "globalRole"
            FROM "User"
            WHERE email = ${email}
            LIMIT 1
        `;

        const user = users[0];

        if (!user) {
            return NextResponse.json({
                success: false,
                step: 'USER_LOOKUP',
                message: 'User not found in database',
                email
            });
        }

        if (!user.passwordHash) {
            return NextResponse.json({
                success: false,
                step: 'PASSWORD_HASH',
                message: 'User has no password hash',
                userId: user.id
            });
        }

        // Test password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                step: 'PASSWORD_VERIFY',
                message: 'Password does not match',
                userId: user.id,
                hashLength: user.passwordHash.length
            });
        }

        return NextResponse.json({
            success: true,
            step: 'COMPLETE',
            message: 'Credentials are valid! Login should work.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                globalRole: user.globalRole
            }
        });

    } catch (error: any) {
        console.error('[TEST-LOGIN] Error:', error);
        return NextResponse.json({
            success: false,
            step: 'ERROR',
            message: error.message
        }, { status: 500 });
    }
}
