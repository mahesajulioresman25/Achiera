'use server';

import { waEngine } from '@/lib/whatsapp/engine';
import { revalidatePath } from 'next/cache';

export async function getWhatsAppStatusAction() {
    try {
        await waEngine.init();
        return { success: true, ...waEngine.getStatus() };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppMessageAction(phone: string, text: string, priority?: number) {
    try {
        await waEngine.sendMessage(phone, text, priority);
        return { success: true };
    } catch (error: any) {
        console.error('[WA Action] Send error:', error);
        return { success: false, error: error.message };
    }
}

export async function logoutWhatsAppAction() {
    try {
        await waEngine.logout();
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
