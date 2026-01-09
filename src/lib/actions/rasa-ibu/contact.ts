'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { emailAlertService } from '@/lib/services/EmailAlertService';

interface ContactMessageData {
    name: string;
    phone: string;
    message: string;
    targetEmail: string;
}

/**
 * Action to handle contact form submissions for Rasa Ibu.
 * Integrates with Intelligence Hub for tracking.
 */
export async function sendContactMessageAction(data: ContactMessageData) {
    try {
        console.log('[Contact Form Submission]', data);

        // 1. Find Rasa Ibu Brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' }
        });

        if (!brand) {
            return { success: false, error: 'Brand tidak ditemukan.' };
        }

        // 2. Track as Analytics Event (Intelligence Hub)
        await prisma.analyticsEvent.create({
            data: {
                brandId: brand.id,
                type: 'HERO_CTA_CLICK', // Using valid enum value from schema.prisma
                metadata: {
                    source: 'CONTACT_FORM',
                    name: data.name,
                    phone: data.phone,
                    email: data.targetEmail,
                    message: data.message.substring(0, 100) + '...'
                }
            }
        });

        // 3. Send Email Notification to Owner (achiera25.id@gmail.com)
        await emailAlertService.sendContactLead({
            name: data.name,
            phone: data.phone,
            email: 'via-contact-form@achiera.com', // Placeholder for from, data.targetEmail is where it goes
            message: data.message,
            targetEmail: data.targetEmail,
            brandName: brand.name
        });

        console.log(`[Intelligence Lead Email Sent to ${data.targetEmail}]`);

        revalidatePath('/rasa-ibu/contact');
        return { success: true };

    } catch (error: any) {
        console.error('[Contact Action Error]', error);
        return { success: false, error: 'Gagal mengirim pesan. Silakan coba lagi.' };
    }
}
