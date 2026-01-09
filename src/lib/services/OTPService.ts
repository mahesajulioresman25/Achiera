import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type OTPType =
    | 'OTP_LOGIN'
    | 'OTP_REGISTER'
    | 'OTP_FORGOT_PASSWORD'
    | 'OTP_PROFILE_UPDATE';

export class OTPService {
    /**
     * Generate a 6-digit OTP code
     */
    private static generateOTPCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate a unique token for the verification
     */
    private static generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Create and store a new OTP
     * @param email - Email address to send OTP to
     * @param type - Type of OTP (login, register, forgot password, etc.)
     * @param userId - Optional user ID if user exists
     * @returns Object containing the OTP code and token
     */
    static async createOTP(email: string, type: OTPType, userId?: string) {
        const code = this.generateOTPCode();
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing unused OTPs for this email and type
        await prisma.verificationToken.updateMany({
            where: {
                email,
                type,
                used: false,
            },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });

        // Create new OTP
        const verificationToken = await prisma.verificationToken.create({
            data: {
                email,
                type,
                code,
                token,
                expiresAt,
                userId,
            },
        });

        console.log(`[OTPService] Created OTP for ${email} (${type}): ${code}`);

        return {
            code,
            token,
            expiresAt,
            id: verificationToken.id,
        };
    }

    static async verifyOTP(email: string, code: string, type: OTPType) {
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                email,
                type,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            console.log(`[OTPService] No active OTP found for ${email} (${type})`);
            return {
                success: false,
                message: 'Kode OTP tidak ditemukan atau sudah kadaluarsa',
            };
        }

        // Check attempts
        if ((verificationToken as any).attempts >= 3) {
            // Invalidate the token
            await prisma.verificationToken.update({
                where: { id: verificationToken.id },
                data: { used: true, usedAt: new Date() }
            });
            return {
                success: false,
                message: 'Terlalu banyak percobaan salah. Silakan minta kode baru.',
            };
        }

        if (verificationToken.code !== code) {
            // Increment attempts
            await prisma.verificationToken.update({
                where: { id: verificationToken.id },
                data: { attempts: { increment: 1 } }
            });

            const remaining = 3 - ((verificationToken as any).attempts + 1);
            return {
                success: false,
                message: `Kode OTP salah. Sisa percobaan: ${remaining}`,
            };
        }

        // Mark as used
        await prisma.verificationToken.update({
            where: { id: verificationToken.id },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });

        console.log(`[OTPService] OTP verified successfully for ${email} (${type})`);

        return {
            success: true,
            token: verificationToken.token,
            userId: verificationToken.userId,
        };
    }

    /**
     * Verify a token (for multi-step flows)
     * @param token - Token to verify
     * @param type - Type of verification
     * @returns Verification result
     */
    static async verifyToken(token: string, type: OTPType) {
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                type,
                used: true, // Token should be marked as used after OTP verification
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            return {
                success: false,
                message: 'Token tidak valid atau sudah kadaluarsa',
            };
        }

        return {
            success: true,
            email: verificationToken.email,
            userId: verificationToken.userId,
        };
    }

    /**
     * Clean up expired tokens (should be run periodically)
     */
    static async cleanupExpiredTokens() {
        const result = await prisma.verificationToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        console.log(`[OTPService] Cleaned up ${result.count} expired tokens`);
        return result.count;
    }

    /**
     * Resend OTP (creates a new one)
     * @param email - Email address
     * @param type - Type of OTP
     * @param userId - Optional user ID
     * @returns New OTP details
     */
    static async resendOTP(email: string, type: OTPType, userId?: string) {
        // Check if there's a recent OTP (within last 1 minute) to prevent spam
        const recentOTP = await prisma.verificationToken.findFirst({
            where: {
                email,
                type,
                createdAt: {
                    gt: new Date(Date.now() - 60 * 1000), // Last 1 minute
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (recentOTP) {
            return {
                success: false,
                message: 'Mohon tunggu 1 menit sebelum meminta kode baru',
                retryAfter: 60 - Math.floor((Date.now() - recentOTP.createdAt.getTime()) / 1000),
            };
        }

        // Create new OTP
        const otp = await this.createOTP(email, type, userId);

        return {
            success: true,
            ...otp,
        };
    }
}
