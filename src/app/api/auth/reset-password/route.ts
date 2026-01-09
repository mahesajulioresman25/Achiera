import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/OTPService';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/reset-password
 * Reset password using verified OTP token
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: 'Token dan password baru harus diisi' },
                { status: 400 }
            );
        }

        // Verify token
        const verification = await OTPService.verifyToken(token, 'OTP_FORGOT_PASSWORD');

        if (!verification.success) {
            return NextResponse.json(
                { error: verification.message },
                { status: 400 }
            );
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email: verification.email },
            data: { passwordHash: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diubah',
        });

    } catch (error) {
        console.error('[Reset Password Error]:', error);
        return NextResponse.json(
            { error: 'Gagal mengubah password' },
            { status: 500 }
        );
    }
}
