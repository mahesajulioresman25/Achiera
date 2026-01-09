import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/OTPService';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/password/reset
 * Update password using a verified OTP token
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, token, newPassword } = body;

        if (!email || !token || !newPassword) {
            return NextResponse.json(
                { error: 'Email, token, dan password baru harus diisi' },
                { status: 400 }
            );
        }

        // 1. Verify token
        const verification = await OTPService.verifyToken(token, 'OTP_FORGOT_PASSWORD');

        if (!verification.success || verification.email !== email) {
            return NextResponse.json(
                { error: 'Token tidak valid atau sudah kadaluarsa' },
                { status: 400 }
            );
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update user password
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                emailVerified: true // Also verify email since they matched OTP
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diperbarui'
        });

    } catch (error) {
        console.error('[Password Reset Error]:', error);
        return NextResponse.json(
            { error: 'Gagal memperbarui password' },
            { status: 500 }
        );
    }
}
