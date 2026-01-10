import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Diagnostic endpoint to test login flow
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // Step 1: Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                globalRole: true,
            }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                step: 'USER_LOOKUP',
                message: 'User not found in database',
                email
            });
        }

        // Step 2: Check password hash exists
        if (!user.passwordHash) {
            return NextResponse.json({
                success: false,
                step: 'PASSWORD_HASH',
                message: 'User exists but has no password set',
                user: { id: user.id, email: user.email, role: user.globalRole }
            });
        }

        // Step 3: Verify password (if provided)
        if (password) {
            const isValid = await bcrypt.compare(password, user.passwordHash);

            return NextResponse.json({
                success: isValid,
                step: 'PASSWORD_VERIFY',
                message: isValid ? 'Password is correct' : 'Password is incorrect',
                user: { id: user.id, email: user.email, role: user.globalRole }
            });
        }

        // No password provided, just return user info
        return NextResponse.json({
            success: true,
            step: 'USER_FOUND',
            message: 'User found with password hash',
            user: { id: user.id, email: user.email, role: user.globalRole },
            passwordHashLength: user.passwordHash.length
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            step: 'ERROR',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
