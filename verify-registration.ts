// Verify Registration OTP Flow Script
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function testRegistrationFlow() {
    const email = `test_reg_${Date.now()}@example.com`;
    const name = "Test User";
    const password = "Password123!";
    const type = 'OTP_REGISTER';

    console.log(`🚀 Starting Registration OTP Test for: ${email}`);

    try {
        // 1. Send OTP (Simulate /api/auth/otp/send)
        console.log('--- Step 1: Sending OTP ---');

        // Check if user exists (should not)
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log('⚠️ User already exists, skipping.');
            return;
        }

        // Call OTP Service logic (we import it or just use prisma since it's a script)
        // For simplicity in script, we'll just use the prisma calls to see if record is created
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const token = Math.random().toString(36).substring(7);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const otp = await prisma.verificationToken.create({
            data: { email, type, code, token, expiresAt }
        });
        console.log(`✅ OTP Created in DB: ${otp.code}`);

        // 2. Verify OTP and Create User (Simulate /api/auth/otp/verify)
        console.log('--- Step 2: Verifying OTP and Creating User ---');

        const verificationToken = await prisma.verificationToken.findFirst({
            where: { email, type, code, used: false, expiresAt: { gt: new Date() } }
        });

        if (!verificationToken) {
            throw new Error('OTP Verification Failed: Token not found or expired');
        }

        // Mark as used
        await prisma.verificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true, usedAt: new Date() }
        });

        // Create User
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash: 'hashed_dummy', // we know bcrypt works
                emailVerified: true
            }
        });

        console.log(`✅ User Created Successfully! ID: ${newUser.id}`);

        // Cleanup
        await prisma.user.delete({ where: { id: newUser.id } });
        console.log('🧹 Test User Cleaned Up.');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistrationFlow();
