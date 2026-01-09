
// src/lib/whatsapp.ts

export const whatsappHelper = {
    /**
     * Generates standard Invoice Message
     */
    formatInvoiceMessage: (params: {
        invoiceNumber: string;
        amount: number;
        status: string;
        paymentUrl: string; // The deep link or web link
        trackingUrl: string;
        customerName: string;
    }) => {
        return `Halo ${params.customerName}! Ini invoice pemesanan Achiera Anda.
Invoice: *${params.invoiceNumber}*
Total: *Rp ${params.amount.toLocaleString()}*
Status: *${params.status}*

Link Payment: ${params.paymentUrl}
Tracking: ${params.trackingUrl}

Terima kasih!`;
    },

    /**
     * Send WA (Stub/Implementation)
     */
    sendWhatsAppInvoice: async (phoneNumber: string, message: string) => {
        console.log(`[WA] Sending to ${phoneNumber}:`, message);
        // Call your WA Gateway API here
        return true;
    }
};
