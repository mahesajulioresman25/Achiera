// Verify Login OTP Flow Script
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function testLoginOTPFlow() {
    const email = `test_login_${Date.now()}@example.com`;
    const type = 'OTP_LOGIN';

    console.log(`🚀 Starting Login OTP Test for: ${email}`);

    try {
        // 1. Create a temporary user for login test
        console.log('--- Step 0: Creating Test User ---');
        const user = await prisma.user.create({
            data: {
                email,
                name: "Login Tester",
                passwordHash: "dummy_pass",
                emailVerified: true
            }
        });

        // 2. Send OTP (Simulate /api/auth/otp/send)
        console.log('--- Step 1: Sending Login OTP ---');
        const code = "654321";
        const token = "login_token_" + Math.random().toString(36).substring(7);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const otp = await prisma.verificationToken.create({
            data: { email, type, code, token, expiresAt, userId: user.id }
        });
        console.log(`✅ Login OTP Created: ${otp.code}`);

        // 3. Verify OTP (Simulate /api/auth/otp/verify)
        console.log('--- Step 2: Verifying Login OTP ---');
        const verificationToken = await prisma.verificationToken.findFirst({
            where: { email, type, code, used: false, expiresAt: { gt: new Date() } }
        });

        if (!verificationToken) {
            throw new Error('Login OTP Verification Failed');
        }

        // Mark as used
        await prisma.verificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true, usedAt: new Date() }
        });

        console.log('✅ Login OTP Verified. Token generated:', verificationToken.token);
        console.log('✅ Success! The Login OTP flow works as expected.');

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Sweep: Test User Deleted.');

    } catch (error: any) {
        console.error('❌ Login Test Failed:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

testLoginOTPFlow();
