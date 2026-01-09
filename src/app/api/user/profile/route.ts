import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OTPService } from '@/lib/services/OTPService';
import bcrypt from 'bcrypt';

/**
 * GET /api/user/profile
 * Fetch current user's profile data
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                profileImage: true,
                emailVerified: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('[Profile GET Error]:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/profile
 * Update user profile with OTP verification for critical fields
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            phone,
            address,
            profileImage,
            newEmail,
            newPassword,
            currentPassword,
            otpToken
        } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if critical fields are being changed
        const isChangingEmail = newEmail && newEmail !== user.email;
        const isChangingPassword = newPassword && currentPassword;

        // Verify OTP for critical changes
        if (isChangingEmail || isChangingPassword) {
            if (!otpToken) {
                return NextResponse.json(
                    { error: 'OTP verification required for this change' },
                    { status: 400 }
                );
            }

            const verification = await OTPService.verifyToken(otpToken, 'OTP_PROFILE_UPDATE');
            if (!verification.success || verification.email !== user.email) {
                return NextResponse.json(
                    { error: 'Invalid or expired OTP token' },
                    { status: 400 }
                );
            }
        }

        // Verify current password if changing password
        if (isChangingPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValidPassword) {
                return NextResponse.json(
                    { error: 'Current password is incorrect' },
                    { status: 400 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {};

        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        if (isChangingEmail) {
            // Check if new email is already taken
            const existingUser = await prisma.user.findUnique({
                where: { email: newEmail }
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 409 }
                );
            }
            updateData.email = newEmail;
            updateData.emailVerified = true; // Email verified via OTP
        }

        if (isChangingPassword) {
            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                profileImage: true,
                emailVerified: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('[Profile PUT Error]:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
