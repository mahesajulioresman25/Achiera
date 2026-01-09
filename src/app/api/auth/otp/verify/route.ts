import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/OTPService';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/otp/verify
 * Verify OTP code and perform action based on type
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code, type, newPassword, name } = body;

        if (!email || !code || !type) {
            return NextResponse.json(
                { error: 'Email, code, dan type harus diisi' },
                { status: 400 }
            );
        }

        // Verify OTP
        const verification = await OTPService.verifyOTP(email, code, type);

        if (!verification.success) {
            return NextResponse.json(
                { success: false, error: verification.message, message: verification.message },
                { status: 400 }
            );
        }

        // Handle different types
        switch (type) {
            case 'OTP_LOGIN':
                // For login, just return success with token
                return NextResponse.json({
                    success: true,
                    message: 'Login berhasil',
                    token: verification.token,
                    userId: verification.userId,
                });

            case 'OTP_REGISTER':
                // Create new user
                const registrationPassword = newPassword || Math.random().toString(36).slice(-10) + 'A1!';
                const hashedPassword = await bcrypt.hash(registrationPassword, 10);

                const newUser = await prisma.user.create({
                    data: {
                        email,
                        name: name || email.split('@')[0],
                        passwordHash: hashedPassword,
                        emailVerified: true,
                        globalRole: 'USER',
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: 'Registrasi berhasil',
                    userId: newUser.id,
                    token: verification.token,
                });

            case 'OTP_FORGOT_PASSWORD':
                // Return token for password reset
                return NextResponse.json({
                    success: true,
                    message: 'OTP terverifikasi',
                    token: verification.token,
                });

            case 'OTP_PROFILE_UPDATE':
                // Mark email as verified
                if (verification.userId) {
                    await prisma.user.update({
                        where: { id: verification.userId },
                        data: { emailVerified: true },
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: 'Email terverifikasi',
                    token: verification.token,
                });

            default:
                return NextResponse.json(
                    { error: 'Type tidak valid' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('[OTP Verify Error]:', error);
        return NextResponse.json(
            { error: 'Gagal memverifikasi OTP' },
            { status: 500 }
        );
    }
}
