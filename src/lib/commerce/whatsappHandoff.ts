/**
 * WhatsApp Handoff Protocol for RASA IBU
 * Generates structured, warm messages for human-to-human order confirmation.
 */

export interface OrderHandoffData {
    customerName: string;
    orderNumber?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    deliveryPreference: string;
}

export function generateWhatsAppMessage(data: OrderHandoffData): string {
    const total = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const itemsList = data.items
        .map(item => `- ${item.name} (${item.quantity}x)`)
        .join('\n');

    const orderRef = data.orderNumber ? `\n*No. Pesanan:* ${data.orderNumber}` : '';

    const message = `Halo Bunda/Tim RASA IBU! 👋

Saya *${data.customerName}*, ingin memesan kehangatan dapur Ibu:
${orderRef}

*Pesanan:*
${itemsList}

*Pilihan Pengiriman:* ${data.deliveryPreference}
*Total Perkiraan:* Rp ${total.toLocaleString('id-ID')}

---
_Catatan: Pesanan saya akan diproses setelah dikonfirmasi oleh tim RASA IBU. Saya menunggu kabar ketersediaan stoknya ya!_`;

    return encodeURIComponent(message);
}

export function getWhatsAppLink(phoneNumber: string, message: string): string {
    return `https://wa.me/${phoneNumber}?text=${message}`;
}
