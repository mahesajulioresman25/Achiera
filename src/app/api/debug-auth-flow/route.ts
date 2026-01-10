import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Test the EXACT login flow that NextAuth uses
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        console.log('[DEBUG-AUTH] Testing login for:', email);

        // Step 1: Find user (EXACT same query as auth.ts)
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                brandRoles: {
                    include: { brand: { select: { name: true, slug: true } } }
                }
            }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                step: 'USER_LOOKUP',
                message: 'User not found',
                email
            });
        }

        console.log('[DEBUG-AUTH] User found:', user.id);

        // Step 2: Check password hash
        if (!user.passwordHash) {
            return NextResponse.json({
                success: false,
                step: 'PASSWORD_HASH',
                message: 'No password hash',
                userId: user.id
            });
        }

        console.log('[DEBUG-AUTH] Password hash exists, length:', user.passwordHash.length);

        // Step 3: Verify password (EXACT same as auth.ts line 105)
        const isValid = await bcrypt.compare(password, user.passwordHash);

        console.log('[DEBUG-AUTH] Password valid:', isValid);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                step: 'PASSWORD_VERIFY',
                message: 'Password incorrect',
                userId: user.id,
                hashLength: user.passwordHash.length
            });
        }

        // Step 4: Map brands (EXACT same as auth.ts)
        const mappedBrands = user.brandRoles.map((br: any) => ({
            brandId: br.brandId,
            brandSlug: br.brand.slug,
            brandName: br.brand.name,
            role: br.role
        }));

        return NextResponse.json({
            success: true,
            step: 'COMPLETE',
            message: 'Login would succeed',
            user: {
                id: user.id,
                email: user.email,
                globalRole: user.globalRole,
                brandsCount: mappedBrands.length
            }
        });

    } catch (error: any) {
        console.error('[DEBUG-AUTH] Error:', error);
        return NextResponse.json({
            success: false,
            step: 'ERROR',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
