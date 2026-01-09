'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function registerUserAction(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
        return { success: false, error: "Semua data wajib diisi." };
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, error: "Email sudah terdaftar." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                // Create a Brand for this user (Personal Brand) or assign logic later
                // For now just create user.
            }
        });

        // Trigger welcome email
        const { sendEmailNotification } = await import('./commerce/subscriptions');
        await sendEmailNotification(email, "Selamat Datang!", "Terima kasih telah mendaftar di Rasa Ibu.");

        return { success: true };
    } catch (error) {
        console.error("Register Error:", error);
        return { success: false, error: "Gagal mendaftar: " + (error as Error).message };
    }
}
