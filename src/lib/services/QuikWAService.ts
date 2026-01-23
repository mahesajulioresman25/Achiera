// QuikWA WhatsApp Service
// Official API: https://quikwa.itsolasco.com/api/v1

import { logSystemActivity } from '@/lib/logger';

interface QuikWASendTextParams {
    session: string;
    to: string;
    text: string;
}

interface QuikWAResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class QuikWAService {
    private apiKey: string;
    private baseUrl: string;
    private defaultSession: string;
    private enabled: boolean;

    constructor() {
        this.apiKey = process.env.QUIKWA_API_KEY || '';
        this.baseUrl = process.env.QUIKWA_API_URL || 'https://quikwa.itsolasco.com/api/v1';
        this.defaultSession = process.env.QUIKWA_DEFAULT_SESSION || 'marketing';
        this.enabled = process.env.QUIKWA_ENABLED === 'true';
    }

    /**
     * Normalize phone number to 628xxx format
     * Supports: 081xxx, 6281xxx, +6281xxx
     */
    private normalizePhoneNumber(phone: string): string {
        // Remove all non-numeric characters
        let normalized = phone.replace(/\D/g, '');

        // Convert 08xxx to 628xxx
        if (normalized.startsWith('08')) {
            normalized = '62' + normalized.substring(1);
        }
        // Add 62 if starts with 8
        else if (normalized.startsWith('8')) {
            normalized = '62' + normalized;
        }
        // Already in 628xxx format
        else if (normalized.startsWith('62')) {
            // Keep as is
        }

        return normalized;
    }

    /**
     * Send text message via QuikWA
     */
    async sendText(params: QuikWASendTextParams): Promise<QuikWAResponse> {
        if (!this.enabled) {
            console.log('[QuikWA] Service disabled, skipping message send');
            return { success: false, error: 'QuikWA service is disabled' };
        }

        if (!this.apiKey) {
            console.error('[QuikWA] API Key not configured');
            return { success: false, error: 'API Key not configured' };
        }

        try {
            const normalizedPhone = this.normalizePhoneNumber(params.to);

            console.log('[QuikWA] Sending to:', `${this.baseUrl}/whatsapp/send/text`);
            console.log('[QuikWA] Payload:', JSON.stringify({
                session: params.session || this.defaultSession,
                to: normalizedPhone,
                text: params.text
            }));

            const response = await fetch(`${this.baseUrl}/whatsapp/send/text`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session: params.session || this.defaultSession,
                    to: normalizedPhone,
                    text: params.text
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[QuikWA] API Error Status:', response.status);
                console.error('[QuikWA] API Error Response:', JSON.stringify(data));
                return {
                    success: false,
                    error: data.message || `HTTP ${response.status} - ${JSON.stringify(data)}`
                };
            }

            console.log('[QuikWA] Message sent successfully to', normalizedPhone);
            return { success: true, data };

        } catch (error: any) {
            console.error('[QuikWA] Network Error:', error);
            return {
                success: false,
                error: error.message || 'Network error'
            };
        }
    }

    /**
     * Get session statistics
     */
    async getStats(): Promise<QuikWAResponse> {
        if (!this.enabled || !this.apiKey) {
            return { success: false, error: 'Service not configured' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/whatsapp/stats`, {
                method: 'GET',
                headers: {
                    'X-API-Key': this.apiKey
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.message };
            }

            return { success: true, data };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Send shipping notification to customer
     */
    async sendShippingNotification(order: {
        invoiceNo: string;
        customerName: string;
        customerPhone: string;
        courierName?: string;
        trackingNo?: string;
        trackingUrl?: string;
        driverName?: string;
        brandId?: string;
    }): Promise<QuikWAResponse> {
        const { whatsappTemplates } = await import('@/lib/templates/whatsappTemplates');
        const message = whatsappTemplates.shippingNotification(order);

        const result = await this.sendText({
            session: this.defaultSession,
            to: order.customerPhone,
            text: message
        });

        // Log activity
        if (order.brandId) {
            await logSystemActivity(
                'SYSTEM',
                result.success ? 'INFO' : 'WARN',
                `WhatsApp Shipping Notification ${result.success ? 'Sent' : 'Failed'}: ${order.invoiceNo}`,
                { phone: order.customerPhone, error: result.error },
                order.brandId
            );
        }

        return result;
    }

    /**
     * Send payment confirmation to customer
     */
    async sendPaymentConfirmation(order: {
        invoiceNo: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number;
        brandId?: string;
    }): Promise<QuikWAResponse> {
        const { whatsappTemplates } = await import('@/lib/templates/whatsappTemplates');
        const message = whatsappTemplates.paymentConfirmation(order);

        const result = await this.sendText({
            session: this.defaultSession,
            to: order.customerPhone,
            text: message
        });

        if (order.brandId) {
            await logSystemActivity(
                'SYSTEM',
                result.success ? 'INFO' : 'WARN',
                `WhatsApp Payment Confirmation ${result.success ? 'Sent' : 'Failed'}: ${order.invoiceNo}`,
                { phone: order.customerPhone, error: result.error },
                order.brandId
            );
        }

        return result;
    }

    /**
     * Send delivery completed notification
     */
    async sendDeliveryCompleted(order: {
        invoiceNo: string;
        customerName: string;
        customerPhone: string;
        brandId?: string;
    }): Promise<QuikWAResponse> {
        const { whatsappTemplates } = await import('@/lib/templates/whatsappTemplates');
        const message = whatsappTemplates.deliveryCompleted(order);

        const result = await this.sendText({
            session: this.defaultSession,
            to: order.customerPhone,
            text: message
        });

        if (order.brandId) {
            await logSystemActivity(
                'SYSTEM',
                result.success ? 'INFO' : 'WARN',
                `WhatsApp Delivery Completed ${result.success ? 'Sent' : 'Failed'}: ${order.invoiceNo}`,
                { phone: order.customerPhone, error: result.error },
                order.brandId
            );
        }

        return result;
    }
}

// Singleton instance
export const quikWAService = new QuikWAService();
