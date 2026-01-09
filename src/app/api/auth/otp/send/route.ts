import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/OTPService';
import { EmailService } from '@/lib/services/EmailService';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/otp/send
 * Send OTP code to email
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, type } = body;

        if (!email || !type) {
            return NextResponse.json(
                { error: 'Email dan type harus diisi' },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ['OTP_LOGIN', 'OTP_REGISTER', 'OTP_FORGOT_PASSWORD', 'OTP_PROFILE_UPDATE'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Type tidak valid' },
                { status: 400 }
            );
        }

        // For login and forgot password, check if user exists
        if (type === 'OTP_LOGIN' || type === 'OTP_FORGOT_PASSWORD') {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return NextResponse.json(
                    { error: 'Email tidak terdaftar' },
                    { status: 404 }
                );
            }
        }

        // For register, check if email is already taken
        if (type === 'OTP_REGISTER') {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email sudah terdaftar' },
                    { status: 409 }
                );
            }
        }

        // Create OTP
        const otp = await OTPService.createOTP(email, type as any);

        // Send OTP email
        await EmailService.sendOTPEmail(email, otp.code, type);

        return NextResponse.json({
            success: true,
            message: 'Kode OTP telah dikirim ke email Anda',
            expiresAt: otp.expiresAt,
        });

    } catch (error) {
        console.error('[OTP Send Error]:', error);
        return NextResponse.json(
            { error: 'Gagal mengirim OTP' },
            { status: 500 }
        );
    }
}
